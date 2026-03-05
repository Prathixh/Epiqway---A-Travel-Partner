
'use client';
import type { DayItinerary, ItineraryItem as ItineraryItemType } from '@/lib/trip';
import ItineraryItem from './itinerary-item';
import Icons from '../icons';
import { Card, CardContent } from '../ui/card';
import { DragDropContext, Droppable, Draggable, OnDragEndResponder } from '@hello-pangea/dnd';
import { timeToMinutes, minutesToTime } from '@/lib/utils';


interface ItineraryTimelineProps {
  dayItinerary: DayItinerary;
  currentItinerary: DayItinerary[];
  onItineraryUpdate: (newItinerary: DayItinerary[]) => void;
  onDragEnd: OnDragEndResponder;
}

export default function ItineraryTimeline({ dayItinerary, onItineraryUpdate, currentItinerary, onDragEnd }: ItineraryTimelineProps) {

  const handleItemUpdate = (updatedItem: ItineraryItemType) => {
    const dayIndex = currentItinerary.findIndex(day => day.day === dayItinerary.day);
    if (dayIndex === -1) return;

    const itemIndex = currentItinerary[dayIndex].items.findIndex(item => item.id === updatedItem.id);
    
    if (itemIndex > -1) {
      const newItinerary = [...currentItinerary];
      const newItems = [...newItinerary[dayIndex].items];
      newItems[itemIndex] = updatedItem;
      newItinerary[dayIndex] = { ...newItinerary[dayIndex], items: newItems };
      onItineraryUpdate(newItinerary);
    }
  };

  const handleItemDelete = (deletedItemId: string) => {
    const dayIndex = currentItinerary.findIndex(day => day.day === dayItinerary.day);
    if (dayIndex === -1) return;

    const items = currentItinerary[dayIndex].items.filter(item => item.id !== deletedItemId);

    const updatedItems = items.reduce((acc, item, index) => {
      if (index === 0) {
        acc.push(item);
      } else {
        const prevItem = acc[index - 1];
        const prevEndTime = timeToMinutes(prevItem.time) + prevItem.duration;
        const travelTime = 15; // Assume 15 mins travel time
        const newStartTime = prevEndTime + travelTime;
        acc.push({ ...item, time: minutesToTime(newStartTime) });
      }
      return acc;
    }, [] as ItineraryItemType[]);

    const newItinerary = [...currentItinerary];
    newItinerary[dayIndex] = { ...newItinerary[dayIndex], items: updatedItems };
    onItineraryUpdate(newItinerary);
  };


  return (
    <div className="space-y-8">
      <Card>
        <CardContent className="p-4 flex items-center justify-around text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
                <Icons.Sunrise className="text-yellow-500"/>
                <span>{dayItinerary.sunrise}</span>
            </div>
            <h2 className="text-xl font-bold text-foreground font-headline text-center">
              Day {dayItinerary.day}: {new Date(dayItinerary.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
            </h2>
            <div className="flex items-center gap-2">
                <Icons.Sunset className="text-orange-500"/>
                <span>{dayItinerary.sunset}</span>
            </div>
        </CardContent>
      </Card>

      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId={`day-${dayItinerary.day}`}>
          {(provided) => (
            <div 
              className="relative"
              {...provided.droppableProps}
              ref={provided.innerRef}
            >
              <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border -translate-x-1/2" />
              {dayItinerary.items.map((item, index) => (
                 <Draggable key={item.id} draggableId={item.id} index={index}>
                  {(provided, snapshot) => (
                     <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className="mb-4"
                        style={{
                          ...provided.draggableProps.style,
                        }}
                     >
                        <ItineraryItem 
                          item={item} 
                          previousItem={index > 0 ? dayItinerary.items[index - 1] : undefined}
                          onItemUpdate={handleItemUpdate}
                          onItemDelete={handleItemDelete}
                          currentItinerary={currentItinerary}
                          dayItinerary={dayItinerary}
                        />
                     </div>
                  )}
                 </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
}
