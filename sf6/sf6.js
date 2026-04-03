const jsPsych = initJsPsych();

let timeline = [];


const keyMap = {};

const clearKeyMap = {
    type: jsPsychCallFunction,
    func: function() {
        Object.keys(keyMap).forEach(key => delete keyMap[key]);
    }
};

function createKeyAssignmentTrial(label) {
  const assignmentTrial = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: `<p>Press the key you want to assign to <strong>${label.toUpperCase()}</strong>.</p>`,
    choices: "ALL_KEYS",
    on_finish: function(data) {
      data.label = label;
    }
  };

  return {
    timeline: [assignmentTrial],
    loop_function: function(data) {

      const response = data.values()[0].response;

      if (Object.values(keyMap).includes(response)) {
        alert("That key is already assigned. Please choose another.");
        return true;
      } else {
        keyMap[label] = response;
        return false;
      }
    }
  };
}


// Load Videos
// --------------------------------------------------------- //

async function loadStimuli() {
  const response = await fetch("videos.json");
  const videoFiles = await response.json();

  function inferLabel(filename) {
    const name = filename.toLowerCase();
    if (name.includes("block")) return "block";
    if (name.includes("counter")) return "counter";
    if (name.includes("drive")) return "drive";
    if (name.includes("hit")) return "hit";
    return null;
  }

  return videoFiles.map(file => ({
    stimulus: `videos/attacks/${file}`,
    correct_answer: inferLabel(file)
  }));
}


async function loadSuper() {
  const response = await fetch("super.json");
  const videoFiles = await response.json();

  function inferLabel(filename) {
    const name = filename.toLowerCase();
    if (name.includes("yes")) return "yes";
    if (name.includes("no")) return "no";
    return null;
  }

  return videoFiles.map(file => ({
    stimulus: `videos/super/${file}`,
    correct_answer: inferLabel(file)
  }));
}


async function loadDrive() {
  const response = await fetch("drive.json");
  const videoFiles = await response.json();

  function inferLabel(filename) {
    const name = filename.toLowerCase();
    if (name.includes("empty")) return "empty";
    if (name.includes("half")) return "half";
    if (name.includes("full")) return "full";
    return null;
  }

  return videoFiles.map(file => ({
    stimulus: `videos/drive/${file}`,
    correct_answer: inferLabel(file)
  }));
}

// --------------------------------------------------------- //






async function buildExperiment() {

  // Stimuli
  // ------------------------------------------------------------- //

    const stimuli = await loadStimuli();
    const grouped = stimuli.reduce((acc, item) => {
        const key = item.correct_answer;
        if (!acc[key]) acc[key] = [];
        acc[key].push(item);
        return acc;
    }, {});

    const sampled = Object.values(grouped).flatMap(group =>
        jsPsych.randomization.shuffle(group).slice(0, 5)
    );



    const stimuliSuper = await loadSuper();
    const groupedSuper = stimuliSuper.reduce((acc, item) => {
        const key = item.correct_answer;
        if (!acc[key]) acc[key] = [];
        acc[key].push(item);
        return acc;
    }, {});

    const sampledSuper = Object.values(groupedSuper).flatMap(group =>
        jsPsych.randomization.shuffle(group).slice(0, 5)
    );



    const stimuliDrive = await loadDrive();
    const groupedDrive = stimuliDrive.reduce((acc, item) => {
        const key = item.correct_answer;
        if (!acc[key]) acc[key] = [];
        acc[key].push(item);
        return acc;
    }, {});

    const sampledDrive = Object.values(groupedDrive).flatMap(group =>
        jsPsych.randomization.shuffle(group).slice(0, 5)
    );


    const videoPaths = stimuli.map(s => s.stimulus);
    const superVideoPaths = stimuliSuper.map(s => s.stimulus);
    const driveVideoPaths = stimuliDrive.map(s => s.stimulus);

    const preload = {
        type: jsPsychPreload,
        video: videoPaths,
        show_progress_bar: true
    };

    const preloadSuper = {
        type: jsPsychPreload,
        video: superVideoPaths,
        show_progress_bar: true
    };

    const preloadDrive = {
        type: jsPsychPreload,
        video: driveVideoPaths,
        show_progress_bar: true
    };

    timeline.push(preload);
    timeline.push(preloadSuper);
    timeline.push(preloadDrive);

    // ------------------------------------------------------------- //





    
    var welcome = {
      type: jsPsychHtmlKeyboardResponse,
      stimulus: "Welcome to the experiment. Press any key to continue.",
      post_trial_gap: 500
    };
    timeline.push(welcome);


    var intro = {
      type: jsPsychHtmlKeyboardResponse,
      stimulus: "<p>This experiment is divided into three sections. Press any key to continue.</p>",
      post_trial_gap: 500
    };
    timeline.push(intro);
    
    
    var instructions = {
      type: jsPsychHtmlKeyboardResponse,
      stimulus: "<p>The first section will flash a series of clips, each one 200ms in length.</p><p>Each clip will include one of the following:</p><p>1. Hit</p><p>2. Block</p><p>3. Counter</p><p>4. Drive Impact</p><p>Press any key for the example video.</p>",
      post_trial_gap: 500
    }
    timeline.push(instructions);


    var exampleVideo = {
      type: jsPsychVideoKeyboardResponse,
      stimulus: ["videos/sf6_example.mp4"],
      height: 540,
      width: 960,
      post_trial_gap: 500,
      trial_ends_after_video: true
    };
    timeline.push(exampleVideo);


    var instructions2 = {
      type: jsPsychHtmlKeyboardResponse,
      stimulus: "<p>Your task is to identify the correct stimulus, and press the key on your keyboard assigned to the specific stimulus.</p><p>Your accuracy and reaction time will be documented and used for the study.</p><p>Press any key to continue and assign your keys.</p>",
      post_trial_gap: 500
    }
    timeline.push(instructions2);

    
    function createKeyMappingSequence() {
      const keyMappingTimeline = {
          timeline: [
              clearKeyMap,
              createKeyAssignmentTrial("hit"),
              createKeyAssignmentTrial("block"),
              createKeyAssignmentTrial("counter"),
              createKeyAssignmentTrial("drive"),
              {
                  type: jsPsychHtmlButtonResponse,
                  stimulus: function() {
                      return `
                          <p>Your key assignments:</p>
                          <p>Hit: ${keyMap.hit}</p>
                          <p>Block: ${keyMap.block}</p>
                          <p>Counter: ${keyMap.counter}</p>
                          <p>Drive: ${keyMap.drive}</p>
                      `;
                  },
                  choices: ['Confirm', 'Map Again'],
                  data: { trial_id: 'confirm_keys' }
              }
          ],
          loop_function: function(data) {
              const confirm = data.filter({ trial_id: 'confirm_keys' }).values()[0];
              return confirm.response === 1;
          }
      };
      timeline.push(keyMappingTimeline);
    }

    createKeyMappingSequence();







    var beginning = {
      type: jsPsychHtmlKeyboardResponse,
      stimulus: "<p>The first section will now begin. It will continue without pause until the end of the phase.</p><p>Keep your attention on the screen and focus.</p><p>Press any key to begin the countdown.</p>",
      post_trial_gap: 500
    }

    timeline.push(beginning)


    function countdownTrial(seconds = 3) {
      return {
        type: jsPsychHtmlKeyboardResponse,
        stimulus: `<div id="countdown" style="font-size:48px;">${seconds}</div>`,
        choices: "NO_KEYS",
        trial_duration: seconds * 1000,
        on_load: function() {
          let timeLeft = seconds;
          const display = document.getElementById("countdown");

          const timer = setInterval(() => {
            timeLeft--;
            if (timeLeft > 0) {
              display.textContent = timeLeft;
            }
          }, 1000);

          setTimeout(() => clearInterval(timer), seconds * 1000);
        }
      };
    }

    timeline.push(countdownTrial(3));





    const trials = sampled.map(item => ({
        type: jsPsychVideoKeyboardResponse,
        height: 540,
        width: 960,
        stimulus: [item.stimulus],
        choices: function() {
          return [keyMap.hit,
                  keyMap.block,
                  keyMap.counter,
                  keyMap.drive
          ];
        },
        data: {
            clip_name: item.stimulus,
            correct_answer: item.correct_answer,
            section: 'offensive'
        },
        on_finish: function(data) {
            let mappedResponse = Object.keys(keyMap).find(
              key => keyMap[key] === data.response
            );
            console.log(mappedResponse);
            data.mappedResponse = mappedResponse;
            data.correct = mappedResponse === data.correct_answer;
        },
        post_trial_gap: 2000,
        video_preload: true,
    }));

    const randomizedTrials = jsPsych.randomization.repeat(trials, 1);

    timeline.push(...randomizedTrials);




  var secDone = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: "<p>Section complete.</p><p>Press any key to continue.</p>",
    post_trial_gap: 500
  };
  timeline.push(secDone);



    var instructions2 = {
      type: jsPsychHtmlKeyboardResponse,
      stimulus: "<p>The second section will play a series of clips.</p><p>Each clip will play a few seconds of gameplay. While keeping your eyes on the green dot shown before and during the clip itself, please attempt to answer the following:</p><p>Does any Super Gauge increase by a level?</p><p>Your accuracy will be measured for this section.</p><p>Press any key for the example video, after which you will assign your keys.</p>",
      post_trial_gap: 500
    }
    timeline.push(instructions2);


    var superExample = {
      type: jsPsychVideoKeyboardResponse,
      height: 540,
        width: 960,
      stimulus: ["videos/sf6_super_example.mp4"],
      post_trial_gap: 500,
      trial_ends_after_video: true
    };
    timeline.push(superExample);


    function createSuperSequence() {
      const keyMappingTimeline = {
          timeline: [
              clearKeyMap,
              createKeyAssignmentTrial("yes"),
              createKeyAssignmentTrial("no"),
              {
                  type: jsPsychHtmlButtonResponse,
                  stimulus: function() {
                      return `
                          <p>Your key assignments:</p>
                          <p>Yes: ${keyMap.yes}</p>
                          <p>No: ${keyMap.no}</p>
                      `;
                  },
                  choices: ['Confirm', 'Map Again'],
                  data: { trial_id: 'confirm_keys' }
              }
          ],
          loop_function: function(data) {
              const confirm = data.filter({ trial_id: 'confirm_keys' }).values()[0];
              return confirm.response === 1;
          }
      };
      timeline.push(keyMappingTimeline);
    }

    createSuperSequence();


    var beginning2 = {
      type: jsPsychHtmlKeyboardResponse,
      stimulus: "<p>The second section will now begin. It will continue without pause until the end of the phase.</p><p>Keep your attention on the screen and focus.</p><p>Press any key to begin the countdown.</p>",
      post_trial_gap: 500
    }

    timeline.push(beginning2)

    timeline.push(countdownTrial(3));

    const trialsSuper = sampledSuper.map(item => ({
        type: jsPsychVideoKeyboardResponse,
        height: 540,
        width: 960,
        stimulus: [item.stimulus],
        choices: function() {
          return [keyMap.yes,
                  keyMap.no
          ];
        },
        data: {
            clip_name: item.stimulus,
            correct_answer: item.correct_answer,
            section: 'super'
        },
        on_finish: function(data) {
            let mappedResponse = Object.keys(keyMap).find(
              key => keyMap[key] === data.response
            );
            console.log(mappedResponse);
            data.mappedResponse = mappedResponse;
            data.correct = mappedResponse === data.correct_answer;
        },
        post_trial_gap: 2000,
        video_preload: true,
    }));

    const randomizedTrialsSuper = jsPsych.randomization.repeat(trialsSuper, 1);

    timeline.push(...randomizedTrialsSuper);






    timeline.push(secDone);

    var instructions3 = {
      type: jsPsychHtmlKeyboardResponse,
      stimulus: "<p>The third section will play a series of clips.</p><p>Each clip will play a few seconds of gameplay. While keeping your eyes on the green dot shown before and during the clip itself, please attempt to answer the following:</p><p>What is the lowest Drive Gauge level visible?</p><p>Your accuracy will be measured.</p><p>Press any key for the example image, after which you will assign your keys.</p>",
      post_trial_gap: 500
    }
    timeline.push(instructions3);


    var driveExample = {
      type: jsPsychImageButtonResponse,
      stimulus: "videos/drive_example.png",
      post_trial_gap: 500,
      choices: ['Continue'],
    };

    timeline.push(driveExample);


    function createDriveSequence() {
      const keyMappingTimeline = {
          timeline: [
              clearKeyMap,
              createKeyAssignmentTrial("empty"),
              createKeyAssignmentTrial("half"),
              createKeyAssignmentTrial("full"),
              {
                  type: jsPsychHtmlButtonResponse,
                  stimulus: function() {
                      return `
                          <p>Your key assignments:</p>
                          <p>Empty: ${keyMap.empty}</p>
                          <p>Half: ${keyMap.half}</p>
                          <p>Full: ${keyMap.full}</p>
                      `;
                  },
                  choices: ['Confirm', 'Map Again'],
                  data: { trial_id: 'confirm_keys' }
              }
          ],
          loop_function: function(data) {
              const confirm = data.filter({ trial_id: 'confirm_keys' }).values()[0];
              return confirm.response === 1;
          }
      };
      timeline.push(keyMappingTimeline);
    }

    createDriveSequence();


    var beginning2 = {
      type: jsPsychHtmlKeyboardResponse,
      stimulus: "<p>The third section will now begin. It will continue without pause until the end of the phase.</p><p>Keep your attention on the screen and focus.</p><p>Press any key to begin the countdown.</p>",
      post_trial_gap: 500
    }

    timeline.push(beginning2)

    timeline.push(countdownTrial(3));

    const trialsDrive = sampledDrive.map(item => ({
        type: jsPsychVideoKeyboardResponse,
        stimulus: [item.stimulus],
        height: 540,
        width: 960,
        choices: function() {
          return [keyMap.empty,
                  keyMap.half,
                  keyMap.full
          ];
        },
        data: {
            clip_name: item.stimulus,
            correct_answer: item.correct_answer,
            section: 'drive'
        },
        on_finish: function(data) {
            let mappedResponse = Object.keys(keyMap).find(
              key => keyMap[key] === data.response
            );
            console.log(mappedResponse);
            data.mappedResponse = mappedResponse;
            data.correct = mappedResponse === data.correct_answer;
        },
        post_trial_gap: 2000,
        video_preload: true,
    }));

    const randomizedTrialsDrive = jsPsych.randomization.repeat(trialsDrive, 1);

    timeline.push(...randomizedTrialsDrive);
















    jsPsych.run(timeline);


    const results = {
      type: jsPsychHtmlButtonResponse,
      stimulus: function() {
          const sections = ['offensive', 'super', 'drive'];
          let output = "";
          let summaryHtml = "";

          sections.forEach(section => {
              const sectionData = jsPsych.data.get().filterCustom(trial =>
                  trial.clip_name !== undefined && trial.section === section
              ).values();

              const totalTrials = sectionData.length;
              const correctTrials = sectionData.filter(trial => trial.correct === true);
              const numCorrect = correctTrials.length;
              const accuracy = totalTrials > 0
                  ? ((numCorrect / totalTrials) * 100).toFixed(2)
                  : "N/A";
              const meanRT = correctTrials.length > 0
                  ? (correctTrials.reduce((sum, t) => sum + t.rt, 0) / correctTrials.length).toFixed(2)
                  : "N/A";
              
              if (section === 'offensive') {
                summaryHtml += `<p><strong>${section.toUpperCase()}</strong> — Total: ${totalTrials}, Correct: ${numCorrect}, Accuracy: ${accuracy}%, Mean RT: ${meanRT}ms</p>`;

                              output += `--- ${section.toUpperCase()} ---\n`;
                              output += `Total: ${totalTrials}, Correct: ${numCorrect}, Accuracy: ${accuracy}%, Mean RT: ${meanRT}ms\n\n`;

                              sectionData.forEach(trial => {
                                  output += `${trial.clip_name}, ${trial.correct_answer}, ${trial.mappedResponse}, ${trial.rt}\n`;
                              });

              }
              else {
                summaryHtml += `<p><strong>${section.toUpperCase()}</strong> — Total: ${totalTrials}, Correct: ${numCorrect}, Accuracy: ${accuracy}%</p>`;

                output += `--- ${section.toUpperCase()} ---\n`;
                output += `Total: ${totalTrials}, Correct: ${numCorrect}, Accuracy: ${accuracy}%\n\n`;

                sectionData.forEach(trial => {
                    output += `${trial.clip_name}, ${trial.correct_answer}, ${trial.mappedResponse}\n`;
              });
              }
              

              output += "\n";
          });

          return `
              <p><strong>Summary:</strong></p>
              ${summaryHtml}
              <hr>
              <p>Copy the results below and add them to the questionnaire:</p>
              <textarea rows="20" cols="80">${output}</textarea>
          `;
      },
      choices: ["Finish"]
    };

    timeline.push(results);


}



buildExperiment();
