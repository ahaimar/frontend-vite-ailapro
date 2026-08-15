import React, {useState} from "react";
import api from "../lib/axios";
import "./style_2.scss";
import {MODULES, TEST_TYPES, DIFFICULTIES} from "../testEditor/test_menu/utils/TestUtils";
import {useToast} from "../ui";
import { ToastBanner } from "../ui/Toest";

type Difficulty = (typeof DIFFICULTIES)[number];

const DIFF_MOD: Record<Difficulty, string> = {
    Easy: "pill--easy",
    Medium: "pill--medium",
    Hard: "pill--hard",
    Mixed: "pill--mixed",
};

// ─── TestsPage ────────────────────────────────────────────────
export function TestsPage() {
    const [isLoading, setLoading] = useState(false);
    const [title, setTitle] = useState("");
    const [module, setModule] = useState("");
    const [questionType, setQuestionType] = useState("");
    const [difficulty, setDifficulty] = useState<Difficulty | "">("");
    const [testType, setTestType] = useState("");

    const {toast, show: showToast} = useToast();

    const resetForm = () => {
        setTitle("");
        setModule("");
        setQuestionType("");
        setDifficulty("");
        setTestType("");
    };

    const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!title.trim() || !module || !questionType || !difficulty || !testType) {
            showToast("All fields are required", 'ERROR');
            return;
        }

        setLoading(true);
        try {
            await api.post("/admin/add/drills/", {
                title,
                module,
                questionType,
                difficulty,
                testType,
            });
            showToast("Drill set created successfully.", 'SUCCESS');
            resetForm();
        } catch (error: unknown) {
            const status = (error as any)?.response?.status;
            const message =
                status === 429
                    ? "Too many requests — slow down!"
                    : "Something went wrong. Please try again.";
            showToast(`${message}`, 'ERROR');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page-root">
            <ToastBanner toast={toast} />
            <div className="page-body">
                {/* ── Header ── */}
                <div className="page-header">
                    <h1 className="page-header__title">Create drill set</h1>
                    <p className="page-header__sub">
                        Configure a new test to add to your module library
                    </p>
                </div>

                {/* ── Card ── */}
                <div className="card">
                    <div className="card__body">
                        <form onSubmit={handleSubmit} noValidate>
                            {/* Basic info */}
                            <span className="section-label">Basic info</span>

                            <div className="form-grid">
                                <div className="form-group form-group--full">
                                    <label className="form-label" htmlFor="title">
                                        Title
                                    </label>
                                    <input
                                        id="title"
                                        className="form-input"
                                        type="text"
                                        placeholder="e.g. Chapter 3 — Algebra Review"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        disabled={isLoading}
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label" htmlFor="module">
                                        Module
                                    </label>
                                    <select
                                        id="module"
                                        className="form-select"
                                        value={module}
                                        onChange={(e) => setModule(e.target.value)}
                                        disabled={isLoading}
                                    >
                                        <option value="" disabled>
                                            Select module
                                        </option>
                                        {MODULES.map((m) => (
                                            <option key={m}>{m}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label className="form-label" htmlFor="testType">
                                        Test type
                                    </label>
                                    <select
                                        id="testType"
                                        className="form-select"
                                        value={testType}
                                        onChange={(e) => setTestType(e.target.value)}
                                        disabled={isLoading}
                                    >
                                        <option value="" disabled>
                                            Select type
                                        </option>
                                        {TEST_TYPES.map((t) => (
                                            <option key={t}>{t}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="divider"/>

                            {/* Question type */}
                            <span className="section-label">Question type</span>
                            <div className="divider"/>

                            {/* Difficulty */}
                            <span className="section-label">Difficulty</span>
                            <div className="pill-group">
                                {DIFFICULTIES.map((d) => (
                                    <div
                                        key={d}
                                        className={`pill ${DIFF_MOD[d]}${
                                            difficulty === d ? " pill--active" : ""
                                        }`}
                                        onClick={() => !isLoading && setDifficulty(d)}
                                    >
                                        {d}
                                    </div>
                                ))}
                            </div>

                            {/* Footer */}
                            <div className="form-footer">
                                <span className="form-footer__meta">All fields required</span>
                                <div className="form-footer__actions">
                                    <button
                                        type="button"
                                        className="btn btn--ghost"
                                        disabled={isLoading}
                                        onClick={resetForm}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn btn--primary"
                                        disabled={isLoading}
                                    >
                                        {isLoading ? (
                                            <span className="spinner"/>
                                        ) : (
                                            "Save drill set"
                                        )}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
  