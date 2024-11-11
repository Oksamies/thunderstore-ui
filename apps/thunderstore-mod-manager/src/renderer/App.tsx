import "@thunderstore/cyberstorm-theme";
import { MemoryRouter as Router, Routes, Route } from "react-router-dom";
import { NewButton } from "@thunderstore/cyberstorm";

function Hello() {
  return (
    <div>
      <h1>Thunderstore Mod Manager CyberAge</h1>
      <NewButton csVariant="special">99 Bottles of beer on the wall</NewButton>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Hello />} />
      </Routes>
    </Router>
  );
}
