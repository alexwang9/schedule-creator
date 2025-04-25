from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from openai import OpenAI
import json
import os

app = Flask(__name__)
CORS(app)

load_dotenv()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
client = OpenAI()

# ──────────────────────────────────────────────────────────────────────────
# 1.  function-calling schema  (note the meeting_times array)
# ──────────────────────────────────────────────────────────────────────────
schedule_schema = {
    "name": "return_schedules",
    "description": "Return up to 5 non-overlapping candidate schedules.",
    "parameters": {
        "type": "object",
        "properties": {
            "schedules": {
                "type": "array",
                "items": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "required": ["course_code", "meeting_times"],
                        "properties": {
                            "course_code": {"type": "string"},
                            "credits": {"type": "integer"},
                            "meeting_times": {
                                "type": "array",
                                "items": {
                                    "type": "object",
                                    "required": ["weekdays", "start_time", "end_time"],
                                    "properties": {
                                        "weekdays": {
                                            "type": "array",
                                            "items": {
                                                "type": "string",
                                                "enum": ["MO", "TU", "WE", "TH", "FR", "SA"]
                                            }
                                        },
                                        "start_time": {
                                            "type":"string","pattern":"^\\d{2}:\\d{2}:\\d{2}$"
                                        },
                                        "end_time": {
                                            "type":"string","pattern":"^\\d{2}:\\d{2}:\\d{2}$"
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        "required": ["schedules"]
    }
}

# ──────────────────────────────────────────────────────────────────────────
# 2.  two ultra-concise few-shot examples
# ──────────────────────────────────────────────────────────────────────────
ex1_in = {
  "classes":[
    {"course_code":"MATH 101","credits":4,
     "meeting_times":[
       {"weekdays":["MO","WE"],"start_time":"09:00:00","end_time":"10:20:00"}]},
    {"course_code":"HIST 201","credits":3,
     "meeting_times":[
       {"weekdays":["TU"],"start_time":"10:30:00","end_time":"12:20:00"},
       {"weekdays":["TH"],"start_time":"10:30:00","end_time":"11:20:00"}]}
  ],
  "preferences":{"target_credits":7,"earliest":"08:00:00","latest":"18:00:00"}
}
ex1_out = {
  "schedules":[[
    {"course_code":"MATH 101",
     "meeting_times":[
       {"weekdays":["MO","WE"],"start_time":"09:00:00","end_time":"10:20:00"}]},
    {"course_code":"HIST 201",
     "meeting_times":[
       {"weekdays":["TU"],"start_time":"10:30:00","end_time":"12:20:00"},
       {"weekdays":["TH"],"start_time":"10:30:00","end_time":"11:20:00"}]}
  ]]
}

ex2_in = {
  "classes":[
    {"course_code":"CS 150","credits":4,
     "meeting_times":[
       {"weekdays":["MO","WE","FR"],
        "start_time":"13:00:00","end_time":"13:50:00"}]},
    {"course_code":"ART 110","credits":3,
     "meeting_times":[
       {"weekdays":["TU"],"start_time":"14:00:00","end_time":"16:40:00"}]},
    {"course_code":"BIO 200","credits":4,
     "meeting_times":[
       {"weekdays":["TH"],"start_time":"08:30:00","end_time":"11:20:00"}]}
  ],
  "preferences":{"target_credits":7,"earliest":"08:00:00","latest":"17:00:00"}
}
ex2_out = {
  "schedules":[[
    {"course_code":"CS 150",
     "meeting_times":[
       {"weekdays":["MO","WE","FR"],
        "start_time":"13:00:00","end_time":"13:50:00"}]},
    {"course_code":"ART 110",
     "meeting_times":[
       {"weekdays":["TU"],"start_time":"14:00:00","end_time":"16:40:00"}]}
  ]]
}

# ──────────────────────────────────────────────────────────────────────────
# 3.  tiny helper for voting
#     (closest to target credits; assumes AI prevented overlaps)
# ──────────────────────────────────────────────────────────────────────────
def score(schedule, credit_map, target):
    tot = sum(credit_map.get(c["course_code"], 0) for c in schedule)
    return -abs(tot - target)

# ──────────────────────────────────────────────────────────────────────────
# 4.  main route
# ──────────────────────────────────────────────────────────────────────────
@app.route('/api/generate-schedules', methods=['POST'])
def generate_schedules():
    payload = request.get_json(silent=True) or {}
    classes = payload.get("classes", [])
    preferences = payload.get("preferences", {})

    credit_map = {c["course_code"]: c.get("credits", 0) for c in classes}
    target = preferences.get("target_credits", 0)

    messages = [
        {
            "role": "system",
            "content": (
                "You are an AI scheduling assistant. Return the result **as JSON**\n"
                "Treat every object in `classes` as one course; a course may have "
                "multiple `meeting_times`. Either all or none of its meeting_times "
                "must appear in a schedule.\n"
                "NEVER modify any field.\n"
                "Build up to 5 conflict-free candidate schedules that use "
                "preferred time window/day list as a suggestion and approach the target credits.\n"
                "Return ONLY via the function `return_schedules`."
            )
        },
        {
            "role": "user",
            "content": json.dumps(ex1_in, separators=(",", ":"))
        },
        {
            "role": "assistant",
            "function_call": {
                "name": "return_schedules",
                "arguments": json.dumps(ex1_out, separators=(",", ":"))
            }
        },
        {
            "role": "user",
            "content": json.dumps(ex2_in, separators=(",", ":"))
        },
        {
            "role": "assistant",
            "function_call": {
                "name": "return_schedules",
                "arguments": json.dumps(ex2_out, separators=(",", ":"))
            }
        },
        {
            "role": "user",
            "content": json.dumps(
                {
                    "classes": classes,
                    "preferences": preferences
                },
                separators=(",", ":")
            )
        }
    ]

    # --------------- self-consistency (3 drafts) ---------------
    all_schedules = []
    for _ in range(3):
        resp = client.chat.completions.create(
            model="gpt-4o",
            messages=messages,
            functions=[schedule_schema],
            function_call={"name": "return_schedules"},
            response_format={"type": "json_object"},
            temperature=0.3,
            max_tokens=3000
        )
        # draft = json.loads(resp.choices[0].message.function_call.arguments)
        args = resp.choices[0].message.function_call.arguments

        if isinstance(args, str):
            draft = json.loads(args)
        else:
            draft = args
        all_schedules.extend(draft["schedules"])

    if not all_schedules:
        return jsonify({"error": "no schedules generated"}), 500
    
    sorted_schedules = sorted(
        all_schedules,
        key=lambda sch: score(sch, credit_map, target),
        reverse=True
    )

    unique_schedules = []
    seen_hashes = set()

    for sch in sorted_schedules:
        # hash the schedule so duplicates from the 3 drafts are dropped
        canonical = sorted(
            (c["course_code"],
             tuple(sorted((tuple(mt["weekdays"]), mt["start_time"], mt["end_time"])
                    for mt in c["meeting_times"])))
            for c in sch
        )
        h = json.dumps(canonical)
        if h not in seen_hashes:
            seen_hashes.add(h)
            unique_schedules.append(sch)
        if len(unique_schedules) == 5:
            break
    
    if not unique_schedules:
        return jsonify({"error": "no unique schedules generated"}), 500
    
    def flatten(schedule):
        flat = []
        for course in schedule:
            for mt in course["meeting_times"]:
                flat.append({
                    "course_code": course["course_code"],
                    "weekdays":    mt["weekdays"],
                    "start_time":  mt["start_time"],
                    "end_time":    mt["end_time"]
                })
        return flat
    
    flattened_schedules = [flatten(s) for s in unique_schedules]
    # print(flattened_schedules)
    return jsonify(flattened_schedules), 200

if __name__ == '__main__':
    app.run(debug=True, host="0.0.0.0", port=5000)


# @app.route('/api/generate-schedules-old', methods=['POST'])
# def generate_schedules_old():
#     data = request.json
#     # Validate and sanitize input: only process known keys
#     classes = data.get("classes", [])
#     preferences = data.get("preferences", {})

#     # Serialize the input data as JSON strings so it's not interpreted as part of system instructions
#     classes_json = json.dumps(classes, indent=2)
#     preferences_json = json.dumps(preferences, indent=2)

#     # Construct a system prompt that locks in the instruction. Notice that:
#     # - The response must be a JSON array of schedule objects.
#     # - Each schedule object must include the keys:
#     #     course_code (string),
#     #     weekdays (array of two-letter abbreviations: MO, TU, WE, TH, FR, SA),
#     #     start_time (HH:MM:SS format),
#     #     end_time (HH:MM:SS format).
#     # - No additional text or explanation is allowed.

#     messages = [
#         {
#             "role": "system",
#             "content": (
#                 "You are an AI scheduling assistant. Your task is to generate multiple possible complete schedule combinations "
#                 "given a list of classes and user preferences. Use the provided classes exactly as given, without modifying any field. "
#                 "In particular, do not change 'start_time' or 'end_time' values for any class. "
#                 "Also, every class object included must have the original 'course_code', 'weekdays', 'start_time', and 'end_time' exactly as provided in the input. "
#                 "Each schedule combination must be a JSON array of class objects "
#                 "selected from the input list such that: \n"
#                 "- There are no overlapping classes within a schedule.\n"
#                 "- The total number of credits is as close as possible to the user's target credits.\n"
#                 "- Only classes that fall within the user's preferred start and end times and on the user's preferred days are included.\n"
#                 "Return a JSON array in which each element is one candidate schedule (an array of class objects). "
#                 "Each class object must contain the following keys: 'course_code' (string), 'weekdays' (array of two-letter abbreviations: MO, TU, WE, TH, FR, SA), "
#                 "'start_time' (HH:MM:SS 24-hour format), and 'end_time' (HH:MM:SS 24-hour format). "
#                 "Make sure the start_time and end_time are exactly the same as what was originally entered, and in 24 hour format."
#                 "Do not include any additional text."
#             )
#         },
#         {
#             "role": "user",
#             "content": (
#                 "Classes:\n" + classes_json +
#                 "\n\nPreferences:\n" + preferences_json +
#                 "\n\nBased on the above information, generate a list of possible schedule combinations that meet "
#                 "the user's preferences. Ensure that the schedules maximize the use of the preferred days "
#                 "and fall within the preferred time window. Attempt to get as close as possible to the preferred number of credits. "
#                 "The classes are ranked in accordance to how much the user wants to take the class (1 = highest), try to respect this preference. "
#                 "Only output a valid JSON array as described."
#             )
#         }
#     ]

#     try:
#         response = client.chat.completions.create(
#             model="gpt-4o",
#             messages=messages,
#             temperature=0.0, # determinism reduces hallucination risk
#             max_tokens=1000
#         )
#         generated_content = response.choices[0].message.content.strip()
#         # If the generated content is wrapped in Markdown code block syntax, remove it.
#         if generated_content.startswith("```"):
#             # Remove the first line (which might contain ```json) and the last line.
#             lines = generated_content.splitlines()
#             # Remove the first and last lines
#             if lines[0].startswith("```"):
#                 lines = lines[1:]
#             if lines and lines[-1].startswith("```"):
#                 lines = lines[:-1]
#             generated_content = "\n".join(lines).strip()
#         print(generated_content)

#         try:
#             schedule_output = json.loads(generated_content)
#         except json.JSONDecodeError as e:
#             print("JSON parsing error:", e)
#             return jsonify({"error": "Invalid JSON response from scheduling assistant."}), 500

#         if not isinstance(schedule_output, list):
#             return jsonify({"error": "Output is not a list as expected."}), 500

#         return jsonify(schedule_output)
#     except Exception as e:
#         print("Error generating schedules:", e)
#         return jsonify({"error": "Failed to generate schedules"}), 500