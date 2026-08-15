import React, { useState } from 'react';
import { useNavigate } from "react-router";

import write_click from "../a1/modules icons-02.png";
import write from "../a1/modules icons-06.png";

import read from "../a1/modules icons-03.png";
import read_click from "../a1/modules icons-07.png";

import listen from "../a1/modules icons-05.png";
import listen_click from "../a1/modules icons-09.png";

import speak from "../a1/modules icons-04.png";
import speak_click from "../a1/modules icons-08.png";
import { EXAM_ROUTES, SKILL_IDS, type SkillId } from './exam';

interface ModuleItem {
  id: SkillId;
  icon: string;
  inClick: string;
}

// Explicit map from SkillId -> its two image assets.
// Keying by SkillId (not an array position) means TypeScript
// will error if a skill is ever added to SKILL_IDS without an entry here.
const MODULE_ASSETS: Record<SkillId, { icon: string; inClick: string }> = {
  writing: { icon: write, inClick: write_click },
  reading: { icon: read, inClick: read_click },
  speaking: { icon: speak, inClick: speak_click },
  listening: { icon: listen, inClick: listen_click },
};

export const Models: React.FC = () => {
  const [activeModule, setActiveModule] = useState<SkillId>('writing');
  const navigate = useNavigate();

  const modulesList: ModuleItem[] = SKILL_IDS.map((id) => ({
    id,
    icon: MODULE_ASSETS[id].icon,
    inClick: MODULE_ASSETS[id].inClick,
  }));

  const handleModuleClick = (moduleId: SkillId) => {
    setActiveModule(moduleId);
    navigate(EXAM_ROUTES.menuTab(moduleId)); // /menu/writing, /menu/reading, etc.
  };

  return (
    <div className="w-full bg-base-100 text-white min-h-screen">
      {/* Header Section */}
      <div className="w-full h-auto px-6 py-8 md:px-1">
        <p className="text-primary text-sm uppercase tracking-wider font-semibold">
          Applicant
        </p>
        <h1 className="text-2xl md:text-3xl font-black text-base-content mt-2">
          IELTS Models
        </h1>
      </div>

      {/* Content Section */}
      <div className="w-full px-6 md:px-12 pb-16">
        {/* Section Title */}
        <div className="mb-12 max-w-max">
          <h2 className="text-[#3a86ff] text-xl md:text-2xl font-black tracking-wide">
            Pick a module
          </h2>
          <h3 className="text-xl md:text-2xl font-black text-white tracking-wide mt-1">
            and start your IELTS practice
          </h3>
          <div className="w-16 h-1 bg-[#3a86ff] mt-3" />
        </div>

        {/* Modules Grid */}
        <div className="flex flex-wrap gap-6 items-start justify-start">
          {modulesList.map((mod) => {
            const isActive = activeModule === mod.id;
            const backgroundImage = isActive ? mod.inClick : mod.icon;

            return (
              <div
                key={mod.id}
                onClick={() => handleModuleClick(mod.id)}
                style={{
                  backgroundImage: `url(${backgroundImage})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
                className={`
                  w-50 h-50 rounded-3xl p-4 
                  flex items-center justify-between
                  transition-all duration-300 
                  focus:outline-none focus:ring-2 focus:ring-[#3a86ff] 
                  relative group
                  ${isActive
                    ? 'scale-105'
                    : 'hover:border-[#3a86ff]/50 hover:shadow-md hover:shadow-[#3a86ff]/10'
                  }
                `}
                aria-label={`Select ${mod.id} module`}
              >
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Models;