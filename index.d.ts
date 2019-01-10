import * as React from "react";
import ResizeObserver from "resize-observer-polyfill";

export interface StickyBoxProps
  extends React.HTMLAttributes<HTMLElement> {
  offset?: number;
  offsetTop?: number;
  offsetBottom?: number;
  bottom?: boolean;
  onChangeMode?: () => void;
}

declare const IStickyBox: React.ComponentClass<StickyBoxProps> & {
  mode: string;
  node: HTMLElement;
  scrollPane: HTMLElement | Window;
  parentHeight: number;
  naturalTop: number;
  nodeHeight: number;
  viewportHeight: number;
  offset: number;
  updateNode: () => void;
  switchToStickyBottom: () => void;
  ron: ResizeObserver;
  ropn: ResizeObserver;
};

export {IStickyBox as default};