import React, { useState, useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import { createContext, useContext } from "react";
import HeaderBar from "./HeaderBar";
import Home from "./Home";
import LoginForm from "./LoginForm";
import SignupForm from "./SignupForm";
import JobsContainer from "./JobsContainer";
import Profile from "./Profile";
import Error404 from "./Error404";
import JobForm from "./JobForm";
import MyJob from "./MyJob";
import { set } from "react-hook-form";
import { JobContext } from "../context/jobContext";
import { UserContext } from "../context/userContext";
import { createTheme } from "@mui/material/styles";
import { orange, green } from "@mui/material/colors";
import { ThemeProvider } from "@emotion/react";

const App = () => {
  const { jobs, dispatch } = useContext(JobContext);
  const { user, dispatch: userDispatch } = useContext(UserContext);

  const [userRole, setUserRole] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [filterJobs, setFilterJobs] = useState(jobs);
  const [applyJob, setApplyJob] = useState(null);
  const [profileUser, setProfileuser] = useState(null);

  const [theme, setTheme] = useState(createTheme());

  useEffect(() => {
    if (userRole === "jobseeker") {
      setTheme(
        createTheme({
          palette: {
            primary: orange,
          },
        })
      );
    } else if (userRole === "employee") {
      setTheme(
        createTheme({
          palette: {
            primary: green,
          },
        })
      );
    } else setTheme(createTheme());
  }, [userRole]);

  useEffect(() => {
    (async () => {
      const res = await fetch("/me");
      if (res.ok) {
        const data = await res.json();
        userDispatch({ type: "fetch", payload: data.user });
        setCurrentUser(data.user);
      }
    })();
  }, []);

  console.log(currentUser);
  console.log(user);

  const handleSubmitJob = (data) => {
    setFilterJobs((current) => [data, ...current]);
  };

  const updateCurrentUser = (user) => {
    setCurrentUser(user);
  };

  const handleJobDelete = (job) => {
    fetch(`/jobs/${job.id}`, {
      method: "DELETE",
    }).then((res) => {
      setFilterJobs((current) => current.filter((item) => item.id !== job.id));
    });
  };

  const handleSetRole = (role) => {
    setUserRole(role);
    setFilterJobs(jobs.filter((job) => job.status === "active"));
  };

  const handleJobsByLocation = (type) => {
    setFilterJobs(
      jobs.filter((job) => job.city.toLowerCase().includes(type.toLowerCase()))
    );
  };

  const handleActiveJob = (active) => {
    if (active) {
      setFilterJobs(
        jobs.filter(
          (job) => job.status === "active" || job.status === "pending"
        )
      );
    } else {
      setFilterJobs(jobs.filter((job) => job.status === "completed"));
    }
  };

  const handleApplyJob = (e, job) => {
    const newHire = {
      job_id: job.id,
      job_seeker_id: currentUser?.id,
    };
    e.preventDefault();
    fetch("/hires", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newHire),
    })
      .then((res) => res.json())
      .then((data) => {
        fetch(`/jobs/${job.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "pending", hire_id: data.id }),
        })
          .then((res) => {
            if (res.ok) {
              const pendingJob = res.json();
              setApplyJob(pendingJob);
              setFilterJobs((current) =>
                current.filter((item) => item.id !== pendingJob.id)
              );
            }
          })
          .catch((err) => console.error(err));
      });
  };

  const handleProfileUser = (user) => {
    setProfileuser(user);
  };

  return (
    <ThemeProvider theme={theme}>
      <div className="app">
        <HeaderBar
          currentUser={currentUser}
          userRole={userRole}
          handleActiveJob={handleActiveJob}
          handleSetRole={handleSetRole}
          handleJobsByLocation={handleJobsByLocation}
          handleProfileUser={handleProfileUser}
          updateCurrentUser={updateCurrentUser}
          theme={theme}
        />
        <Routes>
          <Route
            path="/"
            element={
              <Home
                theme={theme}
                currentUser={currentUser}
                handleSetRole={handleSetRole}
              />
            }
          />
          <Route
            path="/login"
            element={
              <LoginForm
                currentUser={currentUser}
                updateCurrentUser={updateCurrentUser}
                theme={theme}
              />
            }
          />
          <Route
            path="/signup"
            element={
              <SignupForm theme={theme} updateCurrentUser={updateCurrentUser} />
            }
          />
          <Route
            path="/profile/:name"
            element={<Profile theme={theme} profileUser={profileUser} />}
          />
          <Route
            path="/myjobs"
            element={
              <MyJob
                userRole={userRole}
                jobs={filterJobs}
                currentUser={currentUser}
                handleProfileUser={handleProfileUser}
                handleJobDelete={handleJobDelete}
                theme={theme}
              />
            }
          />
          <Route
            path="/newjob"
            element={
              <JobForm
                theme={theme}
                currentUser={user}
                handleSubmitJob={handleSubmitJob}
              />
            }
          />
          <Route
            path="/jobs"
            element={
              <JobsContainer
                theme={theme}
                userRole={userRole}
                currentUser={currentUser}
                jobs={filterJobs}
                handleJobDelete={handleJobDelete}
                handleSubmitJob={handleSubmitJob}
                handleJobsByLocation={handleJobsByLocation}
                handleApplyJob={handleApplyJob}
                handleProfileUser={handleProfileUser}
              />
            }
          />
          <Route path="*" element={<Error404 theme={theme} />} />
        </Routes>
      </div>
    </ThemeProvider>
  );
};

export default App;
