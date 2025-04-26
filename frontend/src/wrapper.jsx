import React, { useState } from "react";
import axios from "axios";
import { IconCircleArrowRight, IconCircleArrowLeft } from "@tabler/icons-react";
import AddPage from "./add-page/add-page";
import PreferencesPage from "./preferences-page/preferences-page";
import Schedule from "./schedule/schedule";
import Calendar from "./schedule/calendar";
import "./wrapper.css";

const sampleEvents = {
  "1": {
    course_code: "EECS 485",
    weekdays: ["MO", "WE", "FR"],
    start_time: "10:00:00",
    end_time: "11:30:00",
  },
  "2": {
    course_code: "BIO 171",
    weekdays: ["TU", "TH"],
    start_time: "09:00:00",
    end_time: "10:30:00",
  },
  "3": {
    course_code: "HIST 210",
    weekdays: ["MO", "WE"],
    start_time: "13:00:00",
    end_time: "14:30:00",
  },
  "4": {
    course_code: "MATH 115",
    weekdays: ["TU", "TH"],
    start_time: "10:30:00",
    end_time: "12:00:00",
  },
  "5": {
    course_code: "PHYSICS 140",
    weekdays: ["FR"],
    start_time: "08:30:00",
    end_time: "10:00:00",
  },
  "6": {
    course_code: "ARTDES 100",
    weekdays: ["WE"],
    start_time: "15:00:00",
    end_time: "17:00:00",
  }
};

const testPayload = {
  classes: [
    {
      course_code: "CS 101",
      credits: 4,
      rank: 1,                       // optional – endpoint will ignore
      meeting_times: [
        { weekdays: ["MO", "WE"], start_time: "09:00:00", end_time: "10:20:00" },
        { weekdays: ["FR"],        start_time: "09:00:00", end_time: "09:50:00" }
      ]
    },
    {
      course_code: "MATH 201",
      credits: 4,
      rank: 2,
      meeting_times: [
        { weekdays: ["TU", "TH"], start_time: "10:30:00", end_time: "11:50:00" }
      ]
    },
    {
      course_code: "BIO 150",
      credits: 3,
      rank: 3,
      meeting_times: [
        { weekdays: ["MO", "WE"], start_time: "13:00:00", end_time: "13:50:00" },
        { weekdays: ["TH"],       start_time: "14:00:00", end_time: "16:50:00" }
      ]
    },
    {
      course_code: "HIST 210",
      credits: 3,
      rank: 4,
      meeting_times: [
        { weekdays: ["TU"], start_time: "08:30:00", end_time: "10:20:00" }
      ]
    },
    {
      course_code: "ENGR 110",
      credits: 2,
      rank: 5,
      meeting_times: [
        { weekdays: ["FR"], start_time: "11:00:00", end_time: "12:50:00" }
      ]
    },
    {
      course_code: "ARTS 100",
      credits: 2,
      rank: 6,
      meeting_times: [
        { weekdays: ["WE"], start_time: "15:00:00", end_time: "17:50:00" }
      ]
    }
  ],

  preferences: {
    target_credits: 14,
    earliest: "08:00:00",
    latest: "18:00:00",
    preferred_days: ["MO", "TU", "WE", "TH", "FR"],
    minimize_gaps: true,
    notes: "Prefer morning blocks; avoid late afternoon if possible"
  }
};


export default function Wrapper() {
  const [page, setPage] = useState(1);
  const [classes, setClasses] = useState([]);
  const [preferences, setPreferences] = useState({});
  const [schedules, setSchedules] = useState([]);
  const [currSchedule, setCurrSchedule] = useState(1);

  const nextPage = () => {
    setPage(page+1);
  }

  const to24h = (t) => (t.length === 5 ? t + ":00" : t); // "10:00" -> "10:00:00"

  const normaliseDays = (d) => ({
    Monday: "MO", Tuesday: "TU", Wednesday: "WE",
    Thursday: "TH", Friday: "FR", Saturday: "SA", Sunday: "SU"
  }[d]);

  const prepClassesForApi = (raw) =>
    raw.map((c) => ({
      course_code: c.name,
      credits: c.credits,
      meeting_times: c.meetingTimes.map((mt) => ({
        weekdays: mt.days.map(normaliseDays),
        start_time: to24h(mt.startTime),
        end_time: to24h(mt.endTime),
      })),
    }));


  const submit = async () => {
    try {
      setPage(3);

      // const rankedClasses = classes.map((cls, i) => ({ ...cls, rank: i }));
      const ready = prepClassesForApi(classes).map((cls, i) => ({ ...cls, rank: i }));

      const API_BASE = process.env.NODE_ENV === 'production'
        ? '/schedule-creator-backend'
        : '';

      const response = await axios.post(`${API_BASE}/api/generate-schedules`, {
        classes: ready,
        preferences
      });

      // const response = await axios.post(
      //   '/api/generate-schedules', 
      //   testPayload,
      //   { headers: { "Content-Type": "application/json" } }
      // );
      // console.log(response.data);
      setSchedules(response.data);
      setCurrSchedule(1);
    } catch (error) {
      console.error("Error submitting data:", error);
    }
  }

  const goLeft = () => {
    if (currSchedule > 1) setCurrSchedule(currSchedule-1);
  };

  const goRight = () => {
    if (currSchedule < schedules.length) setCurrSchedule(currSchedule+1);
  };

  return (
    <div className='wrapper-background'>
      <h1 className='wrapper-title'>sketch</h1>
      {page === 1 ? 
        <p className='wrapper-subtitle'>add classes & rank according to desire to take</p>
        :
        <>
        {page === 2 ? 
          <p className='wrapper-subtitle'>tell us your schedule preferences</p>
          :
          <div style={{display: "flex", alignItems: "center", gap: "5px"}}>
            {currSchedule > 1 && 
              <button onClick={goLeft} className="arrow-button">
                <IconCircleArrowLeft width="20px"/>
              </button>
            }
            <p className='wrapper-subtitle'>
              schedule {currSchedule}
              {schedules.length > 0 && `/${schedules.length}`}
            </p>
            {currSchedule < schedules.length && 
              <button onClick={goRight} className="arrow-button">
                <IconCircleArrowRight width="20px"/>
              </button>
            }
          </div>
        }
        </>
      }
      {page === 1 ?
        <AddPage classes={classes} setClasses={setClasses} nextPage={nextPage}/>
        :
        <>
        {page === 2 ? 
          <PreferencesPage setPreferences={setPreferences} submit={submit}/>
          :
          <Schedule classes={schedules[currSchedule - 1] || []}/>
        }
        </>
      }
      {page === 3 && 
        <>
          <p>unsatisfied with your generated schedules?</p>
          <button className='next-button' onClick={submit} style={{margin: "0 0 50px 0"}}>
            regenerate
          </button>
        </>
      }
    </div>
  );
}
