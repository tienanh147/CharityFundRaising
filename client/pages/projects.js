import React from "react";
import authWrapper from "../helper/authWrapper";
import { useSelector } from "react-redux";
import FundRiserCard from "../components/FundRiserCard";
import Loader from "../components/Loader";
import { useRouter } from "next/router";

const Projects = () => {
  const router = useRouter();
  const { creator } = router.query;
  let projectsList = useSelector((state) => state.projectReducer.projects);
  if (projectsList)
    projectsList = projectsList.filter((project) => {
      if (creator) return project.creator == creator;
      else return project;
    });
  return (
    <div className="px-2 py-4 flex flex-col lg:px-12 lg:flex-row flex-wrap lg:px-12">
      {/* <div className="lg:w-7/12 my-2 lg:my-0 lg:mx-2"> */}
      {projectsList !== undefined ? (
        projectsList.length > 0 ? (
          projectsList.map((data, i) => (
            <div
              className="my-2 flex flex-row w-full lg:w-1/2"
              key={i}
            >
              <FundRiserCard props={data} key={i} />
            </div>
          ))
        ) : (
          <h1 className="text-2xl font-bold text-gray-500 text-center font-sans">
            No project found !
          </h1>
        )
      ) : (
        <Loader />
      )}
      {/* </div> */}
    </div>
  );
};

export default authWrapper(Projects);
