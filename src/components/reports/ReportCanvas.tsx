import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { ReportElementWrapper } from "./ReportElementWrapper";
import { TableElement } from "./elements/TableElement";
import { TextElement } from "./elements/TextElement";
import { ChartElement } from "./elements/ChartElement";
import type { ReportElement, TableElementData, TextElementData, ChartElementData } from "@/types/report";

interface ReportCanvasProps {
  elements: ReportElement[];
  activeElementId: string | null;
  onElementsReorder: (elements: ReportElement[]) => void;
  onElementSelect: (id: string) => void;
  onElementUpdate: (id: string, data: any) => void;
  onElementDelete: (id: string) => void;
  onElementDuplicate: (id: string) => void;
}

export function ReportCanvas({
  elements,
  activeElementId,
  onElementsReorder,
  onElementSelect,
  onElementUpdate,
  onElementDelete,
  onElementDuplicate,
}: ReportCanvasProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = elements.findIndex((el) => el.id === active.id);
      const newIndex = elements.findIndex((el) => el.id === over.id);

      const newElements = [...elements];
      const [movedElement] = newElements.splice(oldIndex, 1);
      newElements.splice(newIndex, 0, movedElement);

      // Update positions
      const updatedElements = newElements.map((el, idx) => ({
        ...el,
        position: idx,
      }));

      onElementsReorder(updatedElements);
    }
  };

  const renderElement = (element: ReportElement) => {
    switch (element.type) {
      case 'table':
        return (
          <TableElement
            data={element.data as TableElementData}
            onChange={(data) => onElementUpdate(element.id, data)}
            isActive={element.id === activeElementId}
          />
        );
      case 'text':
        return (
          <TextElement
            data={element.data as TextElementData}
            onChange={(data) => onElementUpdate(element.id, data)}
            isActive={element.id === activeElementId}
          />
        );
      case 'chart':
        return (
          <ChartElement
            data={element.data as ChartElementData}
            onChange={(data) => onElementUpdate(element.id, data)}
            isActive={element.id === activeElementId}
            allElements={elements}
          />
        );
      default:
        return <div>Unknown element type</div>;
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={elements.map((el) => el.id)}
        strategy={verticalListSortingStrategy}
      >
        <div 
          className="max-w-5xl mx-auto py-8 px-16 min-h-[calc(100vh-12rem)]"
          onClick={() => onElementSelect('')}
        >
          {elements.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <p className="text-lg">No elements yet.</p>
              <p className="text-sm">Use the sidebar to add tables, text, charts, or images.</p>
            </div>
          ) : (
            elements.map((element) => (
              <ReportElementWrapper
                key={element.id}
                elementId={element.id}
                isActive={element.id === activeElementId}
                onSelect={() => onElementSelect(element.id)}
                onDelete={() => onElementDelete(element.id)}
                onDuplicate={() => onElementDuplicate(element.id)}
              >
                {renderElement(element)}
              </ReportElementWrapper>
            ))
          )}
        </div>
      </SortableContext>
    </DndContext>
  );
}
