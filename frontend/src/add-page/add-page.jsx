import React, { useState } from "react";
import { IconPlus } from "@tabler/icons-react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import AddPopup from "../add-class-popup/add-popup";
import SelectedClass from "../selected-class/selected-class";
import "./add-page.css";

export default function AddPage({ classes, setClasses, nextPage }) {
  const [showPopup, setShowPopup] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor)
  );

  const handleAddClass = (newClass) => {
    const id = `class-${Date.now()}`;
    setClasses((prev) => [...prev, { ...newClass, id }]);
    setShowPopup(false);
  };

  const handleDeleteClass = (idToDelete) => {
    setClasses(prev => prev.filter(cls => cls.id !== idToDelete));
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      const oldIndex = classes.findIndex((cls) => cls.id === active.id);
      const newIndex = classes.findIndex((cls) => cls.id === over.id);
      setClasses((items) => arrayMove(items, oldIndex, newIndex));
    } 
  };

  return (
    <div className='add-page-background'>
      {showPopup && (
        <AddPopup setShowPopup={setShowPopup} onSave={handleAddClass} />
      )}

      <button className='add-class-button' onClick={() => setShowPopup(true)}>
        add a class <IconPlus width='12px' />
      </button>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={classes.map((cls) => cls.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className='classes-list'>
            {/* <SelectedClass name="EECS 485" startTime="10:00 AM" endTime="11:30 AM" credits="4"/> */}
            {classes.map((course) => (
              <SortableClass key={course.id} course={course} onDelete={handleDeleteClass}/>
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {classes.length > 0 && (
        <button className='next-button' onClick={nextPage}>
          next
        </button>
      )}
    </div>
  );
}

function SortableClass({ course, onDelete }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition
  } = useSortable({ id: course.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    width: "100%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center"
  };

  return (
    <div ref={setNodeRef} style={style}>
      <SelectedClass
        name={course.name}
        credits={course.credits}
        meetingTimes={course.meetingTimes}
        dragHandleProps={{ ...attributes, ...listeners }}
        onDelete = {() => onDelete(course.id)}
      />
    </div>
  )
}
