"use client";

import { EditorNoSsr } from "./EditorNoSsr";

/** Client island: the editor and Konva. The rest of the home page can stay server-rendered. */
export function EditorHost() {
  return <EditorNoSsr />;
}
