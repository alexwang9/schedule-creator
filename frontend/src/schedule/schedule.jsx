import React from "react";
import Calendar from "./calendar";
import "./schedule.css"

export default function Schedule({classes}) {
  return (
    <div className="schedule-wrapper-background">
      <Calendar events={classes}/>
    </div>
  );
}