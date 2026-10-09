// Screens that plug into the app without editing App.jsx (9 October 2026).
// App.jsx is over 500 KB, too large to change through the GitHub bridge, so its screen switch
// asks this file for any key it does not know before falling back to the Dashboard. To add a
// screen: add its key to src/navs.js and src/data/navigation.js, then a case here.
import React from "react";
import SendIntelligence from "./SendIntelligence.jsx";

export function extraScreen(key, props) {
  switch (key) {
    case "send": return <SendIntelligence onToast={props.onToast} role={props.role} />;
    default: return null;
  }
}
