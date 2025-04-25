import React from 'react';
import './calendar.css';

const Calendar = ({ events, setEvents }) => {
  console.log(events);
  const weekdayMap = {
    MO: 1,
    TU: 2,
    WE: 3,
    TH: 4,
    FR: 5,
    SA: 6,
  };

  const backgroundColors = ["#FFCACA", "#C0FFC6", "#FFE6C1", "#A0C1FF"];
  const subColors = ["#6D3636", "#3F5C42", "#675D4D", "#42527C"];
  
  const timeToRow = (time) => {
    const [hour, minute] = time.split(":").map(Number);
    const minutesSince0800 = (hour-8) * 60 + minute;
    // return (hour - 8) * 2 + (minute / 30) + 1;
    return Math.ceil(minutesSince0800 / 30) + 1;
  }
  
  const hours = Array.from({ length: 14 }, (_, i) => {
    const hour24 = 8 + i; // Convert to 24-hour time starting from 8
    const period = hour24 >= 12 ? "PM" : "AM"; // Determine AM/PM
    const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12; // Convert to 12-hour time
    return `${hour12} ${period}`;
  });

  const convertTo12Hour = (time24) => {
    const [hour, minute] = time24.split(":").map(Number);
    const period = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minute.toString().padStart(2, "0")} ${period}`;
  }

  const timeDiff = (timeStart, timeEnd) => {
    const [hourStart, minuteStart] = timeStart.split(":").map(Number);
    const [hourEnd, minuteEnd] = timeEnd.split(":").map(Number);
    return (hourEnd * 60 + minuteEnd) - (hourStart * 60 + minuteStart);
  }

  return (
    <div className="calendar-container">
      <div className="calendar-header">
        {["Mon", "Tue", "Wed", "Thur", "Fri", "Sat"].map((day, index) => (
          <div key={index} className="calendar-day-header">
            {day}
          </div>
        ))}
      </div>
      <div className={`calendar-grid ${!events || Object.keys(events).length === 0 ? 'gray-out' : ''}`}>
        <div className="calendar-hours">
          {hours.map((hour, index) => (
            <div key={index} className="calendar-hour-label">
              {hour}
            </div>
          ))}
        </div>
        <div className="calendar-main-grid">
          {events && Object.values(events).map((classInfo, index) => {
            const { course_code, weekdays, start_time, end_time } = classInfo;
            // console.log(classInfo);
            const eventColor = backgroundColors[index % backgroundColors.length];
            const lineColor = subColors[index % subColors.length];

            const missingTime = (start_time === "00:00:00" || end_time === "00:00:00");

            const gridRowValue = missingTime 
              ? "1 / 2" 
              : `${timeToRow(start_time)} / ${timeToRow(end_time)}`;
            const timeLabel = missingTime 
              ? "TBA" 
              : `${convertTo12Hour(start_time)} - ${convertTo12Hour(end_time)}`;

            const diff = missingTime ? 60 : timeDiff(start_time, end_time);

            return weekdays && weekdays.map((day) => (
              <div
                key={`${course_code}-${day}`}
                className={"calendar-class-box"}
                style={{
                  gridColumn: weekdayMap[day],
                  gridRow: gridRowValue,
                  backgroundColor: eventColor,
                  borderColor: lineColor,
                  color: lineColor,
                }}
              >
                <div className="calendar-class-info">
                  <div 
                    className="calendar-course-code" 
                    style={{
                      fontSize: diff <= 60 ? "clamp(0.2em, 0.8vw, 1em)" : "clamp(0.4em, 1.1vw, 1.3em)"
                    }}
                  >
                    {course_code}
                  </div>
                  <div 
                    className="calendar-time"
                    style={{
                      fontSize: diff <= 60 ? "clamp(0.1em, 0.5vw, 0.7em)" : "clamp(0.1em, 0.7vw, 0.9em)"
                    }}
                  >
                    {timeLabel}
                  </div>
                </div>

              </div>
            ));
          })}
        </div>
      </div>
    </div>
  );
};

export default Calendar;
