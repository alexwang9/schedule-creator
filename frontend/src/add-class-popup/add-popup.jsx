import React, { useState } from "react";
import { IconX } from "@tabler/icons-react";
import { TextInput, NumberInput, MultiSelect } from "@mantine/core";
import { TimeInput } from "@mantine/dates";
import "./popup.css";

export default function AddPopup({ setShowPopup, onSave }) {
  const [name, setName] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [credits, setCredits] = useState(0);
  const [days, setDays] = useState([]);
  const [meetingTimes, setMeetingTimes] = useState([
    {
      startTime: "",
      endTime: "",
      days: []
    }
  ]);

  const handleAddMeetingTime = () => {
    setMeetingTimes((prev) => [
      ...prev,
      { startTime: "", endTime: "", days: [] }
    ]);
  };

  const handleRemoveMeetingTime = (index) => {
    setMeetingTimes((prev) => prev.filter((_, i) => i !== index));
  };

  const updateMeetingTime = (index, field, value) => {
    setMeetingTimes((prev) => 
      prev.map((mt, i) => {
        if (i === index) {
          return { ...mt, [field]: value };
        }
        return mt;
      })
    );
  }

  const handleSave = () => {
    if (!name || !credits) {
      alert("Please fill out course name and credits.");
      return;
    }

    for (const mt of meetingTimes) {
      if (!mt.startTime || !mt.endTime || mt.days.length === 0) {
        alert("Please fill out all meeting times fully (start/end time + days).");
        return;
      }
    }

    const newClass = { name, credits, meetingTimes };
    onSave(newClass);
  };

  return (
    <div className="add-popup-background">
      <button className="x-button" onClick={() => setShowPopup(false)}>
        <IconX/>
      </button>
      <p className="add-popup-header">tell us more about this class!</p>
      <div className="add-popup-info">
        <TextInput 
          label="course name"
          radius="md"
          withAsterisk
          className="course-name-input"
          value={name}
          onChange={(event) => setName(event.currentTarget.value)}
        />
        <NumberInput 
          label="# of credits"
          radius="md"
          min={0}
          max={8}
          allowDecimal={false}
          withAsterisk
          className="credit-num-input"
          value={credits}
          onChange={setCredits}
        />

        {meetingTimes.map((mt, index) => (
          <div key={index} className="meeting-time-block">
            <div className="meeting-time-top-row">
              <TimeInput
                label="start time"
                radius="md"
                withAsterisk
                value={mt.startTime}
                className="start-time-input"
                onChange={(event) => updateMeetingTime(index, "startTime", event.currentTarget.value)}
              />
              <TimeInput
                label="end time"
                radius="md"
                withAsterisk
                value={mt.endTime}
                className="end-time-input"
                onChange={(event) => updateMeetingTime(index, "endTime", event.currentTarget.value)}
              />
              <MultiSelect
                label="days of week"
                radius="md"
                data={[
                  "Monday",
                  "Tuesday",
                  "Wednesday",
                  "Thursday",
                  "Friday",
                  "Saturday"
                ]}
                clearable
                checkIconPosition="left"
                withAsterisk
                value={mt.days}
                className="weekdays-input"
                onChange={(value) => updateMeetingTime(index, "days", value)}
              />
            </div>

            <div className="meeting-time-bottom-row">
              {meetingTimes.length > 1 && (
                <button onClick={() => handleRemoveMeetingTime(index)} className="meeting-times-button">
                  remove
                </button>
              )}
            </div>
          </div>
        ))}

        <button onClick={handleAddMeetingTime} className="meeting-times-button">
          add
        </button>
      </div>
      <button className="add-popup-save" onClick={handleSave}>save</button>
    </div>
  );
}