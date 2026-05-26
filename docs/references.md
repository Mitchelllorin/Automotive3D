# References

These public resources informed the dimensional envelope, hierarchy, and subsystem layout used in the generated GLB assets.

## Dimension and classification datasets

- **EPA Fuel Economy Downloadable Data** — https://www.fueleconomy.gov/feg/download.shtml  
  Used for open vehicle-class context and dimensional sanity checking against real production passenger cars.
- **NHTSA Vehicle Product Information Catalog (vPIC)** — https://vpic.nhtsa.dot.gov/api/  
  Used for body-style and manufacturer vehicle taxonomy reference.
- **Open Vehicle Data Project / OVMS public data** — https://openvehicles.com/  
  Used as an open vehicle data reference source for broad packaging context.
- **Kaggle: Car Dimensions Dataset** — https://www.kaggle.com/datasets/anderascarso/car-dimensions-dataset  
  Used to benchmark the requested wheelbase, width, and height envelope against real passenger vehicles.

## Mechanical and CAD references

- **MIT OpenCourseWare: Exploring Electric Vehicles** — https://ocw.mit.edu/courses/2-00aj-exploring-electric-vehicles-spring-2020/  
  Used for open educational EV packaging and subsystem placement context.
- **Blender OpenCar Rig** — https://www.blendswap.com/blend/17486  
  Used to inform a clean articulated part hierarchy suitable for wheel, steering, and suspension pivots.
- **MacPherson Strut OpenCAD (task-specified reference)**  
  Used conceptually for the front suspension topology.
- **Multi-Link Suspension OpenCAD (task-specified reference)**  
  Used conceptually for the rear suspension topology.
- **Open Combustion Engine CAD (task-specified reference)**  
  Used conceptually for inline-four engine block, piston, and crankshaft layout.
- **Open EV Powertrain CAD (task-specified reference)**  
  Used conceptually for transmission/driveline packaging discipline.

## Applied specification

The generated models use the exact dimensions required by the task brief:

- Wheelbase: 2700 mm
- Length: 4600 mm
- Width: 1780 mm
- Height: 1450 mm
- Track width: 1550 mm
- Tire diameter: 660 mm
- Rim diameter: 430 mm
- Ground clearance: 150 mm

The assets are authored in **meters** and exported as GLB with separate meshes and mechanically meaningful pivots.
