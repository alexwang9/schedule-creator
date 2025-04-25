import React, { useState } from "react";
import { Textarea, NumberInput, MultiSelect } from "@mantine/core";
import { TimeInput } from "@mantine/dates";
import "./preferences-page.css";

export default function PreferencesPage({ setPreferences, submit }) {
  const [targetCredits, setTargetCredits] = useState("");
  const [prefDays, setPrefDays] = useState([]);
  const [prefStartTime, setPrefStartTime] = useState("");
  const [prefEndTime, setPrefEndTime] = useState("");
  const [otherPrefs, setOtherPrefs] = useState("");

  const handleSave = () => {
    setPreferences({ targetCredits, prefDays, prefStartTime, prefEndTime, otherPrefs });
  }

  return(
    <div className="preferences-page-background">
      <div className="preferences-page-inputs">
        <NumberInput 
          label="target # of credits"
          radius="md"
          min={0}
          allowDecimal={false}
          className="target-credits-input"
          value={targetCredits}
          onChange={setTargetCredits}
        />
        <MultiSelect
          label="what days do you want classes on?"
          radius="md"
          data={['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']}
          clearable
          checkIconPosition="left"
          className="target-days-input"
          value={prefDays}
          onChange={setPrefDays}
        />
        <TimeInput 
          label="what time do you want your classes to start at?"
          radius="md"
          className="target-start-time-input"
          value={prefStartTime}
          onChange={(event) => setPrefStartTime(event.currentTarget.value)}
        />
        <TimeInput 
          label="and end at?"
          radius="md"
          className="target-end-time-input"
          value={prefEndTime}
          onChange={(event) => setPrefEndTime(event.currentTarget.value)}
        />
        <Textarea 
          label="what else should your scheduling assistant take into consideration?"
          radius="md"
          className="other-prefs-input"
          placeholder="I want my schedule to have ..."
          value={otherPrefs}
          onChange={(event) => setOtherPrefs(event.currentTarget.value)}
          autosize={false}
          styles={{
            wrapper: { flex: 1, display: "flex", flexDirection: "column" },
            input: { flex: 1, resize: "none" },
          }}
        />
      </div>
      <button className='next-button' onClick={() => {handleSave(); submit();}}>
        schedule
      </button>
    </div>
  );
}