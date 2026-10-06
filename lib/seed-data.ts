import type { Rubric } from "./types";

// A sample Flex Credit Guide brief so the demo works before any brief is uploaded.
export const SEED_BRIEF = `FLEX CREDIT PLAN

Student: A.C.   Grade: 10   Teacher: Mr. Okafor   State: Pennsylvania

Project: Community Skatepark Design
Ava will work with the Borough Parks & Recreation office to design a small skatepark for the vacant lot on Elm Street. She will survey local skaters, research safety standards and construction costs, produce a scaled site plan and 3D model, write a budget proposal, and present the design at a public borough council meeting.

Credit: 0.5 credit, Geometry (Mathematics) and 0.5 credit, English Language Arts

Standards alignment
- CC.2.3.HS.A.13: Analyze relationships between two-dimensional and three-dimensional objects.
- CC.2.3.HS.A.14: Apply geometric concepts to model and solve real-world problems.
- CC.1.4.11-12.B: Write informative/explanatory texts to examine and convey complex ideas clearly and accurately.
- CC.1.5.11-12.D: Present information, findings, and supporting evidence clearly and appropriately for the audience.

Milestones
1. Skater survey and needs summary
2. Research notes on safety standards and materials
3. Scaled site plan (2D) and 3D model
4. Budget proposal (written)
5. Public presentation to borough council (final deliverable)

Rubric: see criteria below (Beginning / Developing / Proficient / Advanced).`;

export const SEED_RUBRIC: Rubric = {
  criteria: [
    {
      name: "Geometric modeling",
      description:
        "Uses scale, area, volume and angle measurements accurately to model the site and features in 2D and 3D.",
      levels: ["Beginning", "Developing", "Proficient", "Advanced"],
    },
    {
      name: "Research and use of evidence",
      description:
        "Gathers relevant information (survey data, safety standards, costs) and uses it to justify design decisions.",
      levels: ["Beginning", "Developing", "Proficient", "Advanced"],
    },
    {
      name: "Written proposal",
      description:
        "Budget proposal is clear, organized, and accurately conveys complex information to a civic audience.",
      levels: ["Beginning", "Developing", "Proficient", "Advanced"],
    },
    {
      name: "Public presentation",
      description:
        "Presents the design and supporting evidence clearly and appropriately for the borough council audience.",
      levels: ["Beginning", "Developing", "Proficient", "Advanced"],
    },
    {
      name: "Community engagement and iteration",
      description:
        "Incorporates feedback from skaters, mentors and officials and documents how the design changed in response.",
      levels: ["Beginning", "Developing", "Proficient", "Advanced"],
    },
  ],
  standards: ["CC.2.3.HS.A.13", "CC.2.3.HS.A.14", "CC.1.4.11-12.B", "CC.1.5.11-12.D"],
};
