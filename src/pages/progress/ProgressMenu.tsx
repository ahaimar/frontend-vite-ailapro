import { useState } from "react";
import SessionHistory from "../../components/session/SessionHistory";
import ExamData from "./ExamData";

// Define your menu structure here for easy maintenance
const MENU_ITEMS = [
  { id: "exam",   label: "Exam Data",  component: <ExamData /> },
  { id: "mudels",     label: "Mudels",    component: <SessionHistory /> },
];

const ProgressMenu = () => {
  const [activeTab, setActiveTab] = useState(MENU_ITEMS[0].id);

  return (
    <div className="flex min-h-screen w-full bg-base-100">
      {/* Sidebar */}
      <aside className="w-64 p-4 border-r border-base-300 bg-base-200">
        <nav role="tablist" className="flex flex-col gap-2">
          {MENU_ITEMS.map((item) => (
            <button
              key={item.id}
              role="tab"
              aria-selected={activeTab === item.id}
              onClick={() => setActiveTab(item.id)}
              className={`tab tab-lifted justify-start w-full ${
                activeTab === item.id ? "tab-active font-bold" : ""
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-8 bg-base-100">
        {MENU_ITEMS.find((item) => item.id === activeTab)?.component}
      </main>
    </div>
  );
};

export default ProgressMenu;