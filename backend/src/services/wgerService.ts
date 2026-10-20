import { WgerWorkoutPlan } from '../shared/index.js';

export const WGER_WORKOUT_PLANS: WgerWorkoutPlan[] = [
  {
    id: 'wger_plan_recomp',
    title: '30-Day Total Body Recomposition',
    goal: 'Hypertrophy & Strength',
    difficulty: 'Intermediate',
    durationWeeks: 4,
    daysPerWeek: 4,
    description: 'A structured 4-day split balancing progressive overload with metabolic conditioning for lean muscle growth and fat loss.',
    days: [
      {
        dayNumber: 1,
        dayName: 'Upper Body Power & Hypertrophy',
        focus: 'Chest, Back, Shoulders & Triceps',
        targetMuscles: ['Chest', 'Lats', 'Shoulders', 'Triceps'],
        exercises: [
          {
            exerciseId: 'pushups',
            name: 'Standard Push-Ups (Chest Focus)',
            sets: 4,
            repsOrSeconds: '12-15 reps',
            restSeconds: 60,
            equipment: 'Bodyweight',
            targetMuscles: ['Pectorals', 'Anterior Deltoids', 'Triceps'],
            notes: 'Keep elbows at a 45-degree angle from torso, squeeze chest at top.'
          },
          {
            exerciseId: 'dumbbell_row',
            name: 'Single-Arm Dumbbell Rows',
            sets: 4,
            repsOrSeconds: '10-12 reps/side',
            restSeconds: 60,
            equipment: 'Dumbbells',
            targetMuscles: ['Latissimus Dorsi', 'Rhomboids', 'Biceps'],
            notes: 'Pull towards the hip, keep spinal alignment straight.'
          },
          {
            exerciseId: 'shoulder_press',
            name: 'Overhead Dumbbell Shoulder Press',
            sets: 3,
            repsOrSeconds: '10 reps',
            restSeconds: 75,
            equipment: 'Dumbbells',
            targetMuscles: ['Deltoids', 'Triceps', 'Upper Trapezius'],
            notes: 'Do not arch lower back; lock core tight.'
          },
          {
            exerciseId: 'forearm_plank',
            name: 'Core Forearm Plank Finisher',
            sets: 3,
            repsOrSeconds: '60 secs',
            restSeconds: 45,
            equipment: 'Mat',
            targetMuscles: ['Transverse Abdominis', 'Obliques'],
            notes: 'Brace abdominal wall as if taking a punch.'
          }
        ]
      },
      {
        dayNumber: 2,
        dayName: 'Lower Body Strength & Glute Drive',
        focus: 'Quads, Hamstrings, Glutes & Calves',
        targetMuscles: ['Quadriceps', 'Glutes', 'Hamstrings', 'Calves'],
        exercises: [
          {
            exerciseId: 'squats',
            name: 'Deep Bodyweight Squats / Goblet Squats',
            sets: 4,
            repsOrSeconds: '15 reps',
            restSeconds: 75,
            equipment: 'Bodyweight / Dumbbell',
            targetMuscles: ['Quadriceps', 'Gluteus Maximus'],
            notes: 'Crease of hip below knee level; push through midfoot.'
          },
          {
            exerciseId: 'walking_lunges',
            name: 'Alternating Walking Lunges',
            sets: 3,
            repsOrSeconds: '12 reps/leg',
            restSeconds: 60,
            equipment: 'Bodyweight / Dumbbells',
            targetMuscles: ['Quadriceps', 'Glutes', 'Calves'],
            notes: 'Keep front shin vertical; soft landing on back knee.'
          },
          {
            exerciseId: 'romanian_deadlift',
            name: 'Dumbbell Romanian Deadlift (RDL)',
            sets: 4,
            repsOrSeconds: '10-12 reps',
            restSeconds: 75,
            equipment: 'Dumbbells',
            targetMuscles: ['Hamstrings', 'Glutes', 'Lower Back'],
            notes: 'Hinge hips backwards, slight soft knee bend, feel hamstring stretch.'
          },
          {
            exerciseId: 'calf_raises',
            name: 'Standing Calf Raises',
            sets: 4,
            repsOrSeconds: '20 reps',
            restSeconds: 45,
            equipment: 'Bodyweight',
            targetMuscles: ['Gastrocnemius', 'Soleus'],
            notes: 'Hold peak contraction for 1 full second at top.'
          }
        ]
      },
      {
        dayNumber: 3,
        dayName: 'HIIT Cardio Conditioning & Agility',
        focus: 'Metabolic Conditioning & Core Speed',
        targetMuscles: ['Cardiovascular', 'Core', 'Legs', 'Shoulders'],
        exercises: [
          {
            exerciseId: 'jumping_jacks',
            name: 'Dynamic Jumping Jacks',
            sets: 4,
            repsOrSeconds: '45 secs',
            restSeconds: 30,
            equipment: 'Bodyweight',
            targetMuscles: ['Calves', 'Shoulders', 'Cardiovascular System'],
            notes: 'Land softly on the balls of your feet.'
          },
          {
            exerciseId: 'high_knees',
            name: 'High Knees Sprint in Place',
            sets: 4,
            repsOrSeconds: '30 secs max effort',
            restSeconds: 45,
            equipment: 'Bodyweight',
            targetMuscles: ['Hip Flexors', 'Quadriceps', 'Core'],
            notes: 'Pump arms rhythmically and drive knees to hip height.'
          },
          {
            exerciseId: 'mountain_climbers',
            name: 'Cross-Body Mountain Climbers',
            sets: 3,
            repsOrSeconds: '40 secs',
            restSeconds: 30,
            equipment: 'Mat',
            targetMuscles: ['Rectus Abdominis', 'Obliques', 'Shoulders'],
            notes: 'Keep hips low and level throughout.'
          }
        ]
      },
      {
        dayNumber: 4,
        dayName: 'Active Recovery, Mobility & Core Flow',
        focus: 'Spinal Decompression & Flexibility',
        targetMuscles: ['Spine', 'Hips', 'Hamstrings', 'Chest'],
        exercises: [
          {
            exerciseId: 'downward_dog',
            name: 'Downward-Facing Dog (Adho Mukha Svanasana)',
            sets: 3,
            repsOrSeconds: '45 secs hold',
            restSeconds: 30,
            equipment: 'Yoga Mat',
            targetMuscles: ['Hamstrings', 'Calves', 'Lats'],
            notes: 'Push chest toward thighs; lengthen through spine.'
          },
          {
            exerciseId: 'cobra_pose',
            name: 'Bhujangasana (Cobra Spinal Extension)',
            sets: 3,
            repsOrSeconds: '35 secs hold',
            restSeconds: 30,
            equipment: 'Yoga Mat',
            targetMuscles: ['Erector Spinae', 'Chest Expansion'],
            notes: 'Shoulders away from ears; breathe into the diaphragm.'
          },
          {
            exerciseId: 'childs_pose',
            name: 'Balasana (Child’s Pose Restorative)',
            sets: 2,
            repsOrSeconds: '60 secs hold',
            restSeconds: 30,
            equipment: 'Yoga Mat',
            targetMuscles: ['Lower Back', 'Hip Flexors'],
            notes: 'Slow nasal breathing, releasing all spinal compression.'
          }
        ]
      }
    ]
  },
  {
    id: 'wger_plan_hiit',
    title: 'HIIT & Core Calorie Incinerator',
    goal: 'Fat Loss & HIIT',
    difficulty: 'Intermediate',
    durationWeeks: 3,
    daysPerWeek: 3,
    description: 'High-octane interval training designed to burn 400+ kcal per session while building rock-solid core endurance.',
    days: [
      {
        dayNumber: 1,
        dayName: 'Tabata Full-Body Blast',
        focus: 'Aerobic & Anaerobic Threshold',
        targetMuscles: ['Total Body', 'Core', 'Cardio'],
        exercises: [
          {
            exerciseId: 'jumping_jacks',
            name: 'Jumping Jacks Warmup',
            sets: 3,
            repsOrSeconds: '60 secs',
            restSeconds: 20,
            equipment: 'Bodyweight',
            targetMuscles: ['Cardio', 'Calves'],
            notes: 'Steady cadence to elevate core body temperature.'
          },
          {
            exerciseId: 'squats',
            name: 'Air Squat Burnout',
            sets: 4,
            repsOrSeconds: '20 reps fast',
            restSeconds: 30,
            equipment: 'Bodyweight',
            targetMuscles: ['Quads', 'Glutes'],
            notes: 'Maintain strict depth even at speed.'
          },
          {
            exerciseId: 'high_knees',
            name: 'High Knees Sprint Finish',
            sets: 4,
            repsOrSeconds: '30 secs',
            restSeconds: 30,
            equipment: 'Bodyweight',
            targetMuscles: ['Hip Flexors', 'Cardio'],
            notes: 'Explosive drive.'
          }
        ]
      },
      {
        dayNumber: 2,
        dayName: 'Isometric Core & Pelvic Stability',
        focus: 'Transverse Abdominis & Lower Back',
        targetMuscles: ['Deep Core', 'Obliques', 'Glutes'],
        exercises: [
          {
            exerciseId: 'forearm_plank',
            name: 'Forearm Plank with Alternating Leg Lift',
            sets: 4,
            repsOrSeconds: '45 secs',
            restSeconds: 30,
            equipment: 'Mat',
            targetMuscles: ['Transverse Abdominis', 'Glutes'],
            notes: 'Do not allow lower back to sway or dip.'
          },
          {
            exerciseId: 'pushups',
            name: 'Push-Up to Side Plank Rotation',
            sets: 3,
            repsOrSeconds: '10 total',
            restSeconds: 45,
            equipment: 'Mat',
            targetMuscles: ['Chest', 'Obliques', 'Serratus'],
            notes: 'Stabilize arm on rotation.'
          }
        ]
      }
    ]
  },
  {
    id: 'wger_plan_beginner',
    title: 'Beginner Foundation & Joint Health',
    goal: 'Beginner Full Body',
    difficulty: 'Beginner',
    durationWeeks: 4,
    daysPerWeek: 3,
    description: 'Gentle, zero-impact joint-friendly routine for building daily movement habits and cardiovascular resilience.',
    days: [
      {
        dayNumber: 1,
        dayName: 'Gentle Strength & Posture',
        focus: 'Legs, Chest & Spine Alignment',
        targetMuscles: ['Legs', 'Back', 'Core'],
        exercises: [
          {
            exerciseId: 'squats',
            name: 'Bodyweight Chair / Box Squats',
            sets: 3,
            repsOrSeconds: '10-12 reps',
            restSeconds: 60,
            equipment: 'Chair / Bodyweight',
            targetMuscles: ['Quadriceps', 'Glutes'],
            notes: 'Lightly tap the chair with glutes and stand back up.'
          },
          {
            exerciseId: 'pushups',
            name: 'Incline Wall / Countertop Push-Ups',
            sets: 3,
            repsOrSeconds: '10 reps',
            restSeconds: 60,
            equipment: 'Wall',
            targetMuscles: ['Chest', 'Shoulders'],
            notes: 'Builds pressing strength without shoulder strain.'
          },
          {
            exerciseId: 'cobra_pose',
            name: 'Gentle Cobra Chest Stretch',
            sets: 3,
            repsOrSeconds: '30 secs hold',
            restSeconds: 30,
            equipment: 'Mat',
            targetMuscles: ['Lower Back', 'Chest'],
            notes: 'Deep nasal breathing.'
          }
        ]
      }
    ]
  }
];

export async function getWgerWorkoutPlans(): Promise<WgerWorkoutPlan[]> {
  return WGER_WORKOUT_PLANS;
}

export async function getWgerPlanById(id: string): Promise<WgerWorkoutPlan | null> {
  const plan = WGER_WORKOUT_PLANS.find(p => p.id === id);
  return plan || null;
}
