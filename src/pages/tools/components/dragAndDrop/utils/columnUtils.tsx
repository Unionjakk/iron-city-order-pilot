
import { DragAndDropOrderItem, DragAndDropColumn } from "../../../types/dragAndDropTypes";

export const progressMapping: Record<string, string> = {
  "to-pick": "To Pick",
  "picked": "Picked",
  "to-order": "To Order",
  "ordered": "Ordered",
  "to-dispatch": "To Dispatch"
};

export function getColumnsFromItems(orderItems: DragAndDropOrderItem[]): DragAndDropColumn[] {
  const toPickItems = orderItems.filter(item => item.progress === "To Pick" || item.progress === "to pick");
  const pickedItems = orderItems.filter(item => item.progress === "Picked" || item.progress === "picked");
  const toOrderItems = orderItems.filter(item => item.progress === "To Order" || item.progress === "to order");
  const orderedItems = orderItems.filter(item => item.progress === "Ordered" || item.progress === "ordered");
  const toDispatchItems = orderItems.filter(item => item.progress === "To Dispatch" || item.progress === "to dispatch");
  
  return [
    {
      id: "to-pick",
      title: "To Pick",
      items: toPickItems
    },
    {
      id: "picked",
      title: "Picked",
      items: pickedItems
    },
    {
      id: "to-order",
      title: "To Order",
      items: toOrderItems
    },
    {
      id: "ordered",
      title: "Ordered",
      items: orderedItems
    },
    {
      id: "to-dispatch",
      title: "To Dispatch",
      items: toDispatchItems
    }
  ];
}
