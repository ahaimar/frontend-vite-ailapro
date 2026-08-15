import { useState } from "react";

/** Images */

import BG_ONE from "../a1/bg-12.png";

import Mude_1 from "../a1/first page category-11.png"
import Mude_11 from "../a1/first page category-33.png"

import Mude_2 from "../a1/first page category-32.png"
import Mude_22 from "../a1/first page category-10.png"

import { Label } from "../../ui/UI";

import { useNavigate } from "react-router";
import { EXAM_ROUTES } from "./exam";

const Menu_2 = () => {

  const navigate = useNavigate();

  const [isHoveredOne, setIsHoveredOne] = useState(false);
  const [isHoveredTwo, setIsHoveredTwo] = useState(false);

  return (

    <div className="w-full bg-base-100">
      {/** nav */}
      <div className="w-full justify-start px-3 py-5">
        <Label>
          <span className="text-sm font-bold text-primary uppercase tracking-wider">
            applicant
          </span>
        </Label>
        <h1 className="text-4xl md:text-5xl font-black mt-2 mb-6 tracking-tight">
          IELTS Practice Center
        </h1>
      </div>
      {/* Hero Section */}
      <div className="hero min-h-[60vh] max-w-7xl mx-auto px-4 py-8">
        <div className="hero-content flex-col lg:flex-row-reverse w-full justify-between gap-12">
          <img
            src={BG_ONE}
            className="rounded-3xl w-full lg:max-w-md object-cover shadow-2xl border border-slate-800/10"
            alt="Student studying for IELTS exam"
          />
          <div className="max-w-full text-center lg:text-left">
            <p className="text-lg md:text-xl text-primary leading-relaxed capitalize">
              Choose your IELTS experience
            </p>

            <hr className="border-slate-800 rounded-2xl bg-primary max-w-7xl mx-auto my-4 h-1" />

            <div className="flex justify-center items-center gap-6 w-full m-6">
              {/* Modules Option */}
              <div
                onClick={() => navigate(EXAM_ROUTES.moduleSelect)}
                onMouseEnter={() => setIsHoveredOne(true)}
                onMouseLeave={() => setIsHoveredOne(false)}
                style={{ backgroundImage: `url(${isHoveredOne ? Mude_11 : Mude_1})` }}
                className="w-50 h-50 cursor-pointer bg-contain bg-no-repeat bg-center transition-transform duration-200 hover:-translate-y-1"
                role="button"
                aria-label="Choose Modules"
              />
              {/* Full Exam Option */}
              <div
                onClick={() => navigate(EXAM_ROUTES.menuTab("simulator"))}
                onMouseEnter={() => setIsHoveredTwo(true)}
                onMouseLeave={() => setIsHoveredTwo(false)}
                style={{ backgroundImage: `url(${isHoveredTwo ? Mude_22 : Mude_2})` }}
                className="w-50 h-50 cursor-pointer bg-contain bg-no-repeat bg-center transition-transform duration-200 hover:-translate-y-1"
                role="button"
                aria-label="Choose Full Exam"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

}

export default Menu_2;