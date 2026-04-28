// Wait until the page content is ready before attaching interactions.
document.addEventListener("DOMContentLoaded", function () {
  // Shared chart colors used across the page.
  const chartColors = {
    green: "#123c2d",
    blue: "#2f6f8f",
    rust: "#d96c3b",
    grayBlue: "#a8b3ba",
    lightGray: "#c9d1d6",
    grid: "rgba(18, 60, 45, 0.12)",
    text: "#20312b",
  };

  // Shared Chart.js defaults so every graph feels like part of the same design system.
  if (window.Chart) {
    Chart.defaults.font.family = '"Inter", Arial, sans-serif';
    Chart.defaults.color = chartColors.text;
    Chart.defaults.plugins.legend.labels.boxWidth = 14;
    Chart.defaults.plugins.legend.labels.usePointStyle = true;
    Chart.defaults.plugins.legend.labels.pointStyle = "rectRounded";
  }

  // Smooth scroll from the hero button to the first main section.
  const scrollButton = document.getElementById("scroll-button");
  const problemSection = document.getElementById("problem");

  if (scrollButton && problemSection) {
    scrollButton.addEventListener("click", function () {
      problemSection.scrollIntoView({ behavior: "smooth" });
    });
  }

  // Story bar links: smooth scroll to the chosen section.
  const storyLinks = document.querySelectorAll(".story-link");

  storyLinks.forEach(function (link) {
    link.addEventListener("click", function (event) {
      const targetId = link.getAttribute("href");
      const targetSection = targetId ? document.querySelector(targetId) : null;

      if (targetSection) {
        event.preventDefault();
        targetSection.scrollIntoView({ behavior: "smooth" });
      }
    });
  });

  // Expandable cards: used in the Health Impact section.
  const expandableCards = document.querySelectorAll(".expandable-card");

  expandableCards.forEach(function (card) {
    const toggleButton = card.querySelector(".expand-toggle");
    const symbol = card.querySelector(".toggle-symbol");

    if (!toggleButton || !symbol) {
      return;
    }

    function toggleCard() {
      const isOpen = card.classList.toggle("open");
      toggleButton.classList.toggle("active", isOpen);
      toggleButton.setAttribute("aria-expanded", String(isOpen));
      symbol.textContent = isOpen ? "−" : "+";
    }

    toggleButton.addEventListener("click", toggleCard);

    card.addEventListener("keydown", function (event) {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        toggleCard();
      }
    });
  });

  // Evidence toggle: switches between the "without respite" and "with respite" panels.
  const toggleButtons = document.querySelectorAll(".toggle-button");
  const withoutPanel = document.getElementById("without-panel");
  const withPanel = document.getElementById("with-panel");

  toggleButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      const view = button.dataset.view;

      toggleButtons.forEach(function (item) {
        item.classList.remove("active");
        item.setAttribute("aria-selected", "false");
      });

      button.classList.add("active");
      button.setAttribute("aria-selected", "true");

      if (view === "with" && withoutPanel && withPanel) {
        withoutPanel.classList.remove("active");
        withPanel.classList.add("active");
      } else if (withoutPanel && withPanel) {
        withPanel.classList.remove("active");
        withoutPanel.classList.add("active");
      }
    });
  });

  // Build the respite model: each button fills a visual slot and shows a short explanation.
  const modelButtons = document.querySelectorAll(".model-button");
  const modelExplanation = document.getElementById("model-explanation");
  const modelCompleteMessage = document.getElementById("model-complete-message");
  const modelMessages = {
    monitoring:
      "Patients receive regular check-ins from nurses or trained staff who monitor symptoms, wound healing, and overall health status. This allows complications to be identified early and ensures recovery continues safely outside the hospital.",
    medication:
      "Staff help patients manage medications, including proper storage, timing, and adherence to treatment plans. This is critical for medications that require refrigeration, routine dosing, or close monitoring after discharge.",
    case:
      "Case managers coordinate care across providers, schedule follow-up appointments, and help patients navigate healthcare and social services. They also support discharge planning by connecting patients to longer-term care and resources.",
    housing:
      "Programs work with patients to identify and secure more stable housing options after recovery, such as transitional or permanent supportive housing. This helps prevent a return to homelessness and supports long-term health stability.",
  };

  function updateModelCompletion() {
    const activeButtons = document.querySelectorAll(".model-button.active");

    if (modelCompleteMessage) {
      modelCompleteMessage.hidden = activeButtons.length !== modelButtons.length;
    }
  }

  modelButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      const part = button.dataset.part;
      const slot = part
        ? document.querySelector('.model-slot[data-slot="' + part + '"]')
        : null;

      button.classList.toggle("active");

      if (slot) {
        slot.classList.toggle("filled", button.classList.contains("active"));
      }

      if (modelExplanation && part && modelMessages[part]) {
        modelExplanation.hidden = false;
        modelExplanation.innerHTML = "<p>" + modelMessages[part] + "</p>";
      }

      updateModelCompletion();
    });
  });

  // Cost savings slider: uses the placeholder formula requested by the user.
  const investmentSlider = document.getElementById("investment-slider");
  const investmentValue = document.getElementById("investment-value");
  const savingsOutput = document.getElementById("savings-output");
  const respiteCostPerDay = 79;
  const averageRespiteStayDays = 42;
  const costPerRespitePatient = respiteCostPerDay * averageRespiteStayDays;
  const hospitalDaysAvoidedPerPatient = 4.7;
  const estimatedHospitalCostPerDay = 1500;
  let costSavingsChart = null;

  function formatCurrency(amount) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(amount);
  }

  function updateSavings() {
    if (!investmentSlider || !investmentValue || !savingsOutput) {
      return;
    }

    const investment = Number(investmentSlider.value);
    const patientsServed = Math.round(investment / costPerRespitePatient);
    const hospitalDaysAvoided = Math.round(
      (investment / costPerRespitePatient) * hospitalDaysAvoidedPerPatient
    );
    const estimatedHospitalCostsAvoided =
      Math.round(hospitalDaysAvoided * estimatedHospitalCostPerDay);
    const estimatedNetSavings = estimatedHospitalCostsAvoided - investment;

    investmentValue.textContent = formatCurrency(investment);
    savingsOutput.textContent =
      "If Vermont invests " +
      formatCurrency(investment) +
      ", the Buchanan cohort data suggest this could support about " +
      patientsServed.toLocaleString() +
      " respite stays, avoid about " +
      hospitalDaysAvoided.toLocaleString() +
      " inpatient hospital days, and generate an estimated " +
      formatCurrency(estimatedNetSavings) +
      " in net hospital savings.";

    if (costSavingsChart) {
      costSavingsChart.data.datasets[0].data = [
        investment,
        estimatedHospitalCostsAvoided,
        estimatedNetSavings,
      ];
      costSavingsChart.update();
    }
  }

  if (investmentSlider) {
    investmentSlider.addEventListener("input", updateSavings);
    updateSavings();
  }

  // Helper: creates consistent chart options for the different chart cards.
  function createBaseChartOptions() {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "top",
          align: "start",
          onClick: null,
        },
        tooltip: {
          backgroundColor: "rgba(18, 60, 45, 0.95)",
          titleColor: "#ffffff",
          bodyColor: "#ffffff",
          padding: 12,
          cornerRadius: 10,
        },
      },
      scales: {
        x: {
          grid: {
            display: false,
          },
          ticks: {
            color: chartColors.text,
          },
        },
        y: {
          beginAtZero: true,
          grid: {
            color: chartColors.grid,
          },
          ticks: {
            color: chartColors.text,
          },
        },
      },
    };
  }

  // Graph 1: Vermont homelessness increased sharply after 2020.
  if (window.Chart) {
    const homelessnessGrowthCanvas = document.getElementById("homelessnessGrowthChart");

    if (homelessnessGrowthCanvas) {
      new Chart(homelessnessGrowthCanvas, {
        type: "bar",
        data: {
          labels: ["2020", "2025"],
          datasets: [
            {
              label: "Unhoused Vermonters",
              data: [1110, 3386],
              backgroundColor: [chartColors.blue, chartColors.rust],
              borderRadius: 10,
              borderSkipped: false,
            },
          ],
        },
        options: {
          ...createBaseChartOptions(),
          plugins: {
            ...createBaseChartOptions().plugins,
            legend: {
              display: false,
            },
            tooltip: {
              ...createBaseChartOptions().plugins.tooltip,
              callbacks: {
                label: function (context) {
                  return context.dataset.label + ": " + context.raw.toLocaleString();
                },
              },
            },
          },
          scales: {
            ...createBaseChartOptions().scales,
            y: {
              ...createBaseChartOptions().scales.y,
              title: {
                display: true,
                text: "Number of unhoused Vermonters",
              },
            },
          },
        },
      });
    }

    // Graph 2: Vermont emergency shelter capacity compared with overall need.
    const shelterNeedCanvas = document.getElementById("shelterNeedChart");

    if (shelterNeedCanvas) {
      new Chart(shelterNeedCanvas, {
        type: "bar",
        data: {
          labels: ["Total unhoused", "Shelter capacity", "GA Emergency Housing"],
          datasets: [
            {
              label: "People / households",
              data: [3386, 602, 1017],
              backgroundColor: [
                chartColors.rust,
                chartColors.grayBlue,
                chartColors.blue,
              ],
              borderRadius: 10,
              borderSkipped: false,
            },
          ],
        },
        options: {
          ...createBaseChartOptions(),
          plugins: {
            ...createBaseChartOptions().plugins,
            legend: {
              display: false,
            },
            tooltip: {
              ...createBaseChartOptions().plugins.tooltip,
              callbacks: {
                label: function (context) {
                  return context.dataset.label + ": " + context.raw.toLocaleString();
                },
                afterLabel: function (context) {
                  if (context.dataIndex === 1) {
                    return "About 18% of the total unhoused count";
                  }

                  if (context.dataIndex === 2) {
                    return "About 30% of the total unhoused count";
                  }

                  return "";
                },
              },
            },
          },
          scales: {
            ...createBaseChartOptions().scales,
            y: {
              ...createBaseChartOptions().scales.y,
              title: {
                display: true,
                text: "Count",
              },
            },
          },
        },
      });
    }

    // Graph 3: Buchanan et al. cohort study, respite care compared with usual care.
    const cohortRespiteCanvas = document.getElementById("cohortRespiteChart");

    if (cohortRespiteCanvas) {
      new Chart(cohortRespiteCanvas, {
        type: "bar",
        data: {
          labels: ["Inpatient days", "ED visits", "Outpatient visits"],
          datasets: [
            {
              label: "Usual care group",
              data: [8.1, 2.2, 6.0],
              backgroundColor: chartColors.grayBlue,
              borderRadius: 8,
              borderSkipped: false,
            },
            {
              label: "Respite care group",
              data: [3.4, 1.4, 6.7],
              backgroundColor: chartColors.green,
              borderRadius: 8,
              borderSkipped: false,
            },
          ],
        },
        options: {
          ...createBaseChartOptions(),
          plugins: {
            ...createBaseChartOptions().plugins,
            tooltip: {
              ...createBaseChartOptions().plugins.tooltip,
              callbacks: {
                afterBody: function (items) {
                  const index = items[0].dataIndex;
                  const notes = [
                    "Percent reduction: about 58%",
                    "Percent reduction: about 36%",
                    "Percent increase: about 12%",
                  ];

                  return notes[index];
                },
              },
            },
          },
          scales: {
            ...createBaseChartOptions().scales,
            y: {
              ...createBaseChartOptions().scales.y,
              title: {
                display: true,
                text: "Average visits / days",
              },
            },
          },
        },
      });
    }

    // Graph 4: Buchanan cohort-based hospital savings model tied to the slider.
    const costSavingsCanvas = document.getElementById("costSavingsChart");

    if (costSavingsCanvas) {
      costSavingsChart = new Chart(costSavingsCanvas, {
        type: "bar",
        data: {
          labels: [
            "Vermont investment",
            "Hospital costs avoided",
            "Estimated net savings",
          ],
          datasets: [
            {
              label: "Estimated dollars",
              data: [100000, 213000, 113000],
              backgroundColor: [
                chartColors.grayBlue,
                chartColors.green,
                chartColors.green,
              ],
              borderRadius: 10,
              borderSkipped: false,
            },
          ],
        },
        options: {
          ...createBaseChartOptions(),
          plugins: {
            ...createBaseChartOptions().plugins,
            legend: {
              display: false,
            },
            tooltip: {
              ...createBaseChartOptions().plugins.tooltip,
              callbacks: {
                label: function (context) {
                  return context.label + ": " + formatCurrency(context.raw);
                },
              },
            },
          },
          scales: {
            ...createBaseChartOptions().scales,
            y: {
              ...createBaseChartOptions().scales.y,
              title: {
                display: true,
                text: "Dollars",
              },
            },
          },
        },
      });
    }
  }

  // Scroll reveal animation: fades sections in as the user moves through the page.
  const revealElements = document.querySelectorAll(".reveal");
  const revealObserver = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
        }
      });
    },
    {
      threshold: 0.15,
    }
  );

  revealElements.forEach(function (element) {
    revealObserver.observe(element);
  });

  // Story bar active state: highlights the current step as the viewer scrolls.
  const storySections = document.querySelectorAll(".story-section");

  const sectionObserver = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) {
          return;
        }

        const storyName = entry.target.dataset.story;

        storyLinks.forEach(function (link) {
          const isActive = link.dataset.target === storyName;
          link.classList.toggle("active", isActive);
        });
      });
    },
    {
      rootMargin: "-35% 0px -45% 0px",
      threshold: 0.2,
    }
  );

  storySections.forEach(function (section) {
    sectionObserver.observe(section);
  });

  // Animated failure loop: steps pulse through the pathway while the section is in view.
  const failureSection = document.getElementById("failure");
  const loopSteps = document.querySelectorAll(".loop-step");
  let loopInterval = null;
  let activeLoopIndex = 0;

  function showLoopStep(index) {
    loopSteps.forEach(function (step, stepIndex) {
      step.classList.toggle("active", stepIndex === index);
    });
  }

  function startLoopAnimation() {
    if (loopInterval || loopSteps.length === 0) {
      return;
    }

    showLoopStep(activeLoopIndex);

    loopInterval = window.setInterval(function () {
      activeLoopIndex = (activeLoopIndex + 1) % loopSteps.length;
      showLoopStep(activeLoopIndex);
    }, 1000);
  }

  function stopLoopAnimation() {
    if (loopInterval) {
      window.clearInterval(loopInterval);
      loopInterval = null;
    }
  }

  if (failureSection && loopSteps.length > 0) {
    const failureObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            startLoopAnimation();
          } else {
            stopLoopAnimation();
          }
        });
      },
      {
        threshold: 0.35,
      }
    );

    failureObserver.observe(failureSection);
  }
});
