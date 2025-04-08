import { Routes, Route } from "react-router";

import { Home } from "routes/Home";
import {ComponentGenerator} from "routes/ComponentGenerator";

// Shows creating protected routes
// https://www.youtube.com/watch?v=eFPvXGZETiY

function AppRouter() {
  return (
    <Routes>
      <Route exact path="/home" element={<Home />} />
      <Route exact path="/componentGenerator" element={<ComponentGenerator />} />
      <Route path="/" element={<Home />} />
    </Routes>
  );
}

export { AppRouter };
