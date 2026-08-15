import CardManager from "./card/CardManager.tsx";
import {SpeakManger} from "./spikingTask/SpeakManger.tsx";
import ReadManger from "./readTask/ReadManger.tsx";
import {WriteManager} from "./writeTask/WriteManager.tsx";
import ListenManager from "./listenTask/ListenManager.tsx";

export default async function MainTasksAdd() {

    return (
        <div className="flex flex-col w-full min-h-screen bg-base-200">

            <div className="w-full max-w-4xl m-6">
                <h1 className="text-3xl font-bold text-base-content">Integrated environment creation</h1>
                <p className="text-base-content/60">Choose a category to create a new task.</p>
            </div>

            <div className="tabs tabs-lifted w-full justify-center items-center">

                {/* Write Test Tab */}
                <input
                    type="radio"
                    name="dashboard_tabs"
                    className="tab"
                    aria-label="Writing"
                />
                <div className="tab-content ">
                    <hr className="border-indigo-500 shadow-lg shadow-indigo-500/50"/>
                    <WriteManager />
                </div>
                <input
                    type="radio"
                    name="dashboard_tabs"
                    className="tab"
                    aria-label="Listening"
                />
                <div className="tab-content">
                    <hr className="border-indigo-500 shadow-lg shadow-indigo-500/50"/>
                    <ListenManager />
                </div>
                <input
                    type="radio"
                    name="dashboard_tabs"
                    className="tab"
                    aria-label="Reading"
                />
                <div className="tab-content">
                    <hr className="border-indigo-500 shadow-lg shadow-indigo-500/50"/>
                    <ReadManger/>
                </div>
                <input
                    type="radio"
                    name="dashboard_tabs"
                    className="tab"
                    aria-label="Speaking"
                />
                <div className="tab-content">
                    <hr className="border-indigo-500 shadow-lg shadow-indigo-500/50"/>
                    <SpeakManger />
                </div>

                <input
                    type="radio"
                    name="dashboard_tabs"
                    className="tab"
                    aria-label="Card"
                    defaultChecked
                />

                <div className="tab-content">
                    <hr className="border-indigo-500 shadow-lg shadow-indigo-500/50"/>
                    <CardManager/>
                </div>
            </div>
        </div>
    )
}