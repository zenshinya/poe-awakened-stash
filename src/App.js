import React, { useEffect } from "react";
import { Input } from "antd";
import axios from "axios";

import "antd/dist/antd.css";
import "./App.css";

const STASH_ITEM_API = "character-window/get-stash-items";

function App() {
  return (
    <div className="App">
      <Input />
    </div>
  );
}

export default App;
