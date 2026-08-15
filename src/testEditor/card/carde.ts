import type {ListenTest} from "../listenTask/listenDTO.ts";
import type {ReadTest} from "../readTask/readDTO.ts";
import type {SpeakTest} from "../spikingTask/speak.ts";
import type {WriteTest} from "../writeTask/writeDTO.ts";

export type Status     = "draft" | "published" | "archived";
export type TestType   = "mock_test" | "practice_test" | "mini_test";
export type AccessType = "free" | "paid";
export type IELTSType  = "academic" | "general" | "both";
export type Difficulty = "Easy" | "Medium" | "Hard" | "Mixed";
export type SkillKey   = "writing" | "reading" | "listening" | "speaking";


export interface CardSkills {
  writing:   WriteTest | null;
  reading:   ReadTest | null;
  listening: ListenTest | null;
  speaking:  SpeakTest | null;
}

export interface IELTSCard {
  _id:              string;
  title:            string;
  description:      string;
  testType:         TestType;
  accessType:       AccessType;
  type:             IELTSType;

  status:           Status;
  skills:           CardSkills;
  writeTest:        WriteTest | null | undefined;
  listenTest:       ListenTest | null | undefined;
  speakTest:        SpeakTest | null | undefined;
  readTest:         ReadTest | null | undefined;
  metadata?: {
    difficulty?:    Difficulty;
    topic?:             string;
    estimatedDuration?: number;
    tags?:              string[];
  };
  createdAt?: string;
  updatedAt?: string;
}

export type CardForm = Omit<IELTSCard, "status" | "createdAt" | "updatedAt">;

export const EMPTY_FORM: CardForm = {
  _id:    '',
  title: "",
  description: "",
  testType: "mock_test",
  accessType: "free",
  type: "both",
  writeTest:        null,
  listenTest:       null,
  speakTest:        null,
  readTest:         null,
  skills: {writing: null, reading: null, listening: null, speaking: null},
  metadata: {topic: "", difficulty: "Medium", estimatedDuration: 165, tags: []},
};


