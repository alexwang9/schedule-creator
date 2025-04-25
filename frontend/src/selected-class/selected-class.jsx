import React from "react";
import { IconPencil, IconX, IconLineHeight } from "@tabler/icons-react";
import "./selected-class.css";

export default function SelectedClass({name, credits, meetingTimes, dragHandleProps, onDelete}) {
  return (
    <div className="selected-class-background">
      <div className="selected-class-info">
        <p>{name} <span style={{fontSize: "13px"}}>({credits} credit{credits !== 1 && "s"})</span></p>
        {/* <p style={{fontSize: "13px"}}>{startTime} - {endTime}</p> */}
      </div>
      <div className="class-buttons">
        <button className="selected-class-button" {...dragHandleProps}><IconLineHeight /></button>
        <button className="selected-class-button" onClick={onDelete}><IconX /></button>
      </div>

    </div>
  );
}