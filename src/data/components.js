/**
 * Component definitions for the Automotive3D MVP.
 * Each entry maps a mesh name to rich metadata displayed in the Parts tab.
 * Structure: Vehicle → Subsystem → Component
 */

export const COMPONENTS = {

  // ── Engine ───────────────────────────────────────────────────────────────
  engine_block: {
    id: 'engine_block',
    label: 'Engine Block',
    subsystemId: 'engine',
    function:
      'The main structural housing of the engine. Contains cylinder bores, coolant passages, and oil galleries. Supports all major internal components including the crankshaft and cylinder head.',
    tags: ['structural', 'engine-core'],
    relatedComponents: ['pistons', 'crankshaft', 'camshaft'],
    failureSymptoms: [
      'Oil leaks from gaskets or cracks',
      'Overheating due to blocked coolant passages',
      'Loss of compression across cylinders',
      'Coolant contamination in oil (milky oil)',
    ],
    maintenanceNote:
      'Inspect for cracks or warping during major engine service. Pressure-test the block during a rebuild.',
  },
  pistons: {
    id: 'pistons',
    label: 'Pistons',
    subsystemId: 'engine',
    function:
      'Reciprocating components that compress the air–fuel mixture and transfer combustion force to the crankshaft via connecting rods. Each cylinder has one piston.',
    tags: ['engine-core', 'moving'],
    relatedComponents: ['engine_block', 'crankshaft', 'fuel_injectors'],
    failureSymptoms: [
      'Blue smoke from exhaust (oil burning)',
      'Low or uneven compression readings',
      'Increased oil consumption',
      'Engine knock or pinging',
    ],
    maintenanceNote:
      'Replace piston rings during an engine rebuild. Check ring gap specifications per the factory service manual.',
  },
  crankshaft: {
    id: 'crankshaft',
    label: 'Crankshaft',
    subsystemId: 'engine',
    function:
      'Converts the linear reciprocating motion of the pistons into rotational motion that drives the transmission and accessories.',
    tags: ['engine-core', 'moving'],
    relatedComponents: ['pistons', 'engine_block', 'starter_motor'],
    failureSymptoms: [
      'Deep knocking noise from lower engine',
      'Excessive engine vibration',
      'Sudden oil pressure loss',
      'Complete engine seizure in severe cases',
    ],
    maintenanceNote:
      'Check bearing clearances with Plastigage during rebuild. Inspect journals for scoring or out-of-round.',
  },
  camshaft: {
    id: 'camshaft',
    label: 'Camshaft',
    subsystemId: 'engine',
    function:
      'Controls the opening and closing of intake and exhaust valves, synchronized with the crankshaft via timing chain or belt.',
    tags: ['engine-core', 'moving', 'valve-train'],
    relatedComponents: ['valves', 'crankshaft', 'engine_block'],
    failureSymptoms: [
      'Rough or unstable idle',
      'Noticeable loss of power',
      'Repetitive ticking or tapping from the top of the engine',
      'Poor fuel economy',
    ],
    maintenanceNote:
      'Inspect lobes and journals during a timing belt or chain replacement service.',
  },
  valves: {
    id: 'valves',
    label: 'Valve Cover / Valves',
    subsystemId: 'engine',
    function:
      'Intake and exhaust valves control gas flow into and out of combustion chambers. The valve cover seals the valve train and prevents oil from escaping.',
    tags: ['engine-core', 'valve-train'],
    relatedComponents: ['camshaft', 'engine_block'],
    failureSymptoms: [
      'Oil leaks at the valve cover gasket',
      'Repetitive ticking noise at idle',
      'Rough idle or cylinder misfires',
      'Oil burning on the exhaust manifold',
    ],
    maintenanceNote:
      'Replace the valve cover gasket as needed. Adjust valve clearances to factory spec if applicable.',
  },

  // ── Cooling ──────────────────────────────────────────────────────────────
  radiator: {
    id: 'radiator',
    label: 'Radiator',
    subsystemId: 'cooling',
    function:
      'Heat exchanger that dissipates engine heat by passing hot coolant through thin tubes while air flows across aluminum or copper cooling fins.',
    tags: ['cooling', 'heat-exchanger'],
    relatedComponents: ['water_pump', 'thermostat', 'coolant_hoses', 'fan'],
    failureSymptoms: [
      'Engine overheating (temperature gauge in the red)',
      'Visible coolant leaks under the front of the vehicle',
      'Discolored or rusty coolant',
      'Steam rising from the engine bay',
    ],
    maintenanceNote:
      'Flush and replace coolant every 2 years or per the manufacturer schedule. Inspect fins for clogging or physical damage.',
  },
  water_pump: {
    id: 'water_pump',
    label: 'Water Pump',
    subsystemId: 'cooling',
    function:
      'Circulates coolant through the engine block, cylinder head, radiator, and heater core to maintain optimal operating temperature.',
    tags: ['cooling', 'pump', 'moving'],
    relatedComponents: ['radiator', 'thermostat', 'coolant_hoses'],
    failureSymptoms: [
      'Engine overheating',
      'Coolant leak near the front of the engine (weep hole)',
      'Whining or squealing noise from the belt area',
      'Coolant mixing with engine oil',
    ],
    maintenanceNote:
      'Typically replaced alongside the timing belt at 60,000–100,000 mile intervals. Inspect the impeller for erosion.',
  },
  thermostat: {
    id: 'thermostat',
    label: 'Thermostat',
    subsystemId: 'cooling',
    function:
      'Temperature-sensitive valve that keeps coolant within the engine until operating temperature is reached, then opens to allow full circulation through the radiator.',
    tags: ['cooling', 'valve'],
    relatedComponents: ['water_pump', 'radiator', 'coolant_hoses'],
    failureSymptoms: [
      'Engine takes very long to warm up or stays cold',
      'Engine overheats (thermostat stuck closed)',
      'Heater blows cold air',
      'Poor fuel economy at cold temperatures',
    ],
    maintenanceNote:
      'Inexpensive and simple to replace. Consider replacing during any water pump service to reduce future labor costs.',
  },
  coolant_hoses: {
    id: 'coolant_hoses',
    label: 'Coolant Hoses',
    subsystemId: 'cooling',
    function:
      'Flexible rubber or silicone tubes that carry coolant between the engine, radiator, heater core, and thermostat housing.',
    tags: ['cooling', 'hose'],
    relatedComponents: ['radiator', 'water_pump', 'thermostat'],
    failureSymptoms: [
      'Visible coolant puddles under the vehicle',
      'Engine overheating from coolant loss',
      'Hoses that feel soft, mushy, or collapsed',
      'Sweet coolant odor inside the cabin',
    ],
    maintenanceNote:
      'Squeeze hoses at cold idle to check for softness or sponginess. Replace every 4 years regardless of appearance.',
  },
  fan: {
    id: 'fan',
    label: 'Cooling Fan',
    subsystemId: 'cooling',
    function:
      'Draws air through the radiator when the vehicle is stationary or moving slowly, maintaining adequate airflow for engine and A/C cooling.',
    tags: ['cooling', 'moving'],
    relatedComponents: ['radiator', 'alternator'],
    failureSymptoms: [
      'Engine overheats at idle but cools at highway speed',
      'Air conditioning performance degrades at low speeds',
      'Loud fan noise or grinding bearing',
      'Fan not spinning despite engine heat',
    ],
    maintenanceNote:
      'Electric fans are controlled by the coolant temperature sensor or ECU. Check the fan relay and fuse before replacing the motor.',
  },

  // ── Electrical ───────────────────────────────────────────────────────────
  battery: {
    id: 'battery',
    label: 'Battery',
    subsystemId: 'electrical',
    function:
      'Stores electrical energy in a lead-acid or AGM cell and provides the initial surge current required to crank the engine. Also powers accessories when the engine is off.',
    tags: ['electrical', 'power-storage'],
    relatedComponents: ['alternator', 'starter_motor', 'fuse_box', 'wiring'],
    failureSymptoms: [
      'Engine fails to crank or cranks slowly',
      'Dim headlights or interior lights',
      'Battery warning light on dashboard',
      'Electrical accessories behave erratically',
    ],
    maintenanceNote:
      'Test resting voltage annually (should be ≥12.4V). Replace every 3–5 years or when a load test indicates weakness.',
  },
  alternator: {
    id: 'alternator',
    label: 'Alternator',
    subsystemId: 'electrical',
    function:
      'Converts mechanical engine energy into AC electricity, which is rectified to DC to recharge the battery and power the entire electrical system while the engine runs.',
    tags: ['electrical', 'generator', 'moving'],
    relatedComponents: ['battery', 'wiring', 'fan'],
    failureSymptoms: [
      'Battery warning light or volt meter reading low',
      'Headlights dim at idle, brighten at revs',
      'Electrical accessories cutting out',
      'Battery repeatedly going dead',
    ],
    maintenanceNote:
      'Measure charging voltage at battery terminals with engine running (should be 13.5–14.5V). Inspect drive belt tension.',
  },
  fuse_box: {
    id: 'fuse_box',
    label: 'Fuse Box',
    subsystemId: 'electrical',
    function:
      'Contains fuses and relays that protect individual electrical circuits from overcurrent damage. The underhood fuse box handles high-current circuits including the starter and alternator.',
    tags: ['electrical', 'protection'],
    relatedComponents: ['battery', 'wiring', 'starter_motor'],
    failureSymptoms: [
      'A single accessory or circuit stops working',
      'Visible blown fuse (broken filament)',
      'Burning smell from the fuse panel area',
      'Repeated fuse failures indicating a short circuit',
    ],
    maintenanceNote:
      'Always replace blown fuses with the exact amperage rating. Never use a higher-amperage fuse or a wire bypass.',
  },
  starter_motor: {
    id: 'starter_motor',
    label: 'Starter Motor',
    subsystemId: 'electrical',
    function:
      "Electric motor that engages a pinion gear with the engine flywheel ring gear to crank the engine during startup.",
    tags: ['electrical', 'motor', 'moving'],
    relatedComponents: ['battery', 'fuse_box', 'crankshaft'],
    failureSymptoms: [
      'Engine will not crank at all',
      'Single loud click when turning the key (solenoid engaging)',
      'Grinding noise during start (damaged ring gear)',
      'Intermittent no-start condition',
    ],
    maintenanceNote:
      'Starters typically last 100,000–150,000 miles. Check solenoid contacts if the starter engages but the motor does not spin.',
  },
  wiring: {
    id: 'wiring',
    label: 'Wiring Harness',
    subsystemId: 'electrical',
    function:
      'Bundled network of insulated electrical cables that distributes power and signals between all vehicle components, sensors, actuators, and the ECU.',
    tags: ['electrical', 'wiring'],
    relatedComponents: ['battery', 'fuse_box', 'alternator', 'starter_motor'],
    failureSymptoms: [
      'Intermittent or random electrical faults',
      'Multiple warning lights appearing together',
      'Burning smell from wiring',
      'Specific components failing without explanation',
    ],
    maintenanceNote:
      'Inspect for chafing, heat damage, or rodent damage during routine service. Apply dielectric grease to connectors in high-moisture areas.',
  },

  // ── Fuel ─────────────────────────────────────────────────────────────────
  fuel_tank: {
    id: 'fuel_tank',
    label: 'Fuel Tank',
    subsystemId: 'fuel',
    function:
      "Stores the vehicle's fuel supply under the rear body. Includes a fuel level sender for the gauge and typically houses the fuel pump module.",
    tags: ['fuel', 'storage'],
    relatedComponents: ['fuel_pump', 'fuel_lines'],
    failureSymptoms: [
      'Visible fuel puddles under the rear of the vehicle',
      'Persistent fuel smell with no visible leak',
      'Inaccurate fuel gauge reading',
      'EVAP fault codes (P0440, P0442)',
    ],
    maintenanceNote:
      'Inspect for rust, cracks, and physical damage annually. EVAP smoke testing reveals small leaks.',
  },
  fuel_pump: {
    id: 'fuel_pump',
    label: 'Fuel Pump',
    subsystemId: 'fuel',
    function:
      'Pressurizes and delivers fuel from the tank to the fuel rail and injectors at a consistent pressure (typically 35–65 PSI depending on the application).',
    tags: ['fuel', 'pump', 'moving'],
    relatedComponents: ['fuel_tank', 'fuel_lines', 'fuel_injectors'],
    failureSymptoms: [
      'Engine cranks but will not start',
      'Engine sputters or hesitates under heavy load',
      'Loss of power at highway speeds',
      'High-pitched whining noise from the fuel tank area',
    ],
    maintenanceNote:
      'Typically integrated into the fuel tank module assembly. Replace at 60,000–100,000 miles or when fuel pressure tests below spec.',
  },
  fuel_injectors: {
    id: 'fuel_injectors',
    label: 'Fuel Injectors',
    subsystemId: 'fuel',
    function:
      'Electronically controlled nozzles that spray a precisely metered and atomized mist of fuel into each cylinder or intake port on command from the ECU.',
    tags: ['fuel', 'injection', 'electronic'],
    relatedComponents: ['fuel_pump', 'throttle_body', 'pistons', 'o2_sensor'],
    failureSymptoms: [
      'Rough idle or engine stumble',
      'Single-cylinder misfire codes (P030X)',
      'Poor fuel economy',
      'Black smoke from the exhaust',
      'Engine hesitation on acceleration',
    ],
    maintenanceNote:
      'Add fuel injector cleaner every 30,000 miles. Have injectors flow-tested and professionally cleaned if misfires persist.',
  },
  throttle_body: {
    id: 'throttle_body',
    label: 'Throttle Body',
    subsystemId: 'fuel',
    function:
      'Controls the volume of air entering the intake manifold in response to accelerator pedal position, working with the ECU to regulate engine power output.',
    tags: ['fuel', 'air-intake', 'electronic'],
    relatedComponents: ['fuel_injectors', 'engine_block'],
    failureSymptoms: [
      'Rough or fluctuating idle',
      'Engine stalling at low speeds',
      'Hesitation or stumble on initial acceleration',
      'Electronic throttle control warning light',
    ],
    maintenanceNote:
      'Clean the throttle bore and plate every 30,000 miles with throttle-body-safe cleaner to remove carbon deposits.',
  },
  fuel_lines: {
    id: 'fuel_lines',
    label: 'Fuel Lines',
    subsystemId: 'fuel',
    function:
      'High-pressure steel or reinforced rubber hoses that route fuel from the tank/pump assembly to the fuel rail and return excess fuel back to the tank.',
    tags: ['fuel', 'hose'],
    relatedComponents: ['fuel_tank', 'fuel_pump', 'fuel_injectors'],
    failureSymptoms: [
      'Visible fuel drips or puddles under the vehicle',
      'Strong fuel odor without an obvious source',
      'Engine starving for fuel under hard acceleration',
      'Fire risk in severe cases',
    ],
    maintenanceNote:
      'Inspect for cracks, kinks, and corrosion annually—especially at rubber-to-metal joints. Replace any damaged section immediately.',
  },

  // ── Exhaust ───────────────────────────────────────────────────────────────
  exhaust_manifold: {
    id: 'exhaust_manifold',
    label: 'Exhaust Manifold',
    subsystemId: 'exhaust',
    function:
      'Collects exhaust gases from all cylinders and routes them into a single outlet pipe. Cast iron or stainless steel; bolts directly to the cylinder head ports.',
    tags: ['exhaust', 'heat'],
    relatedComponents: ['engine_block', 'catalytic_converter', 'o2_sensor'],
    failureSymptoms: [
      'Distinct ticking or popping exhaust leak, loudest at cold start',
      'Burning smell from the engine bay',
      'Reduced engine power and throttle response',
      'Exhaust fumes entering the cabin',
    ],
    maintenanceNote:
      'Inspect the gasket after high-heat cycles. Torque manifold bolts to factory spec; re-torque after first heat cycle.',
  },
  catalytic_converter: {
    id: 'catalytic_converter',
    label: 'Catalytic Converter',
    subsystemId: 'exhaust',
    function:
      'Uses precious-metal catalysts (platinum, palladium, rhodium) to convert harmful exhaust pollutants—hydrocarbons (HC), carbon monoxide (CO), and nitrogen oxides (NOx)—into water vapor and CO₂.',
    tags: ['exhaust', 'emissions'],
    relatedComponents: ['exhaust_manifold', 'o2_sensor', 'exhaust_pipe'],
    failureSymptoms: [
      'Rotten-egg or sulfur smell from the exhaust',
      'Rattling noise from underneath the vehicle',
      'P0420 fault code (catalyst efficiency below threshold)',
      'Vehicle fails emissions inspection',
    ],
    maintenanceNote:
      'Protect from oil or coolant contamination, which poisons the catalyst. Under normal conditions it lasts 100,000+ miles.',
  },
  o2_sensor: {
    id: 'o2_sensor',
    label: 'O₂ Sensor',
    subsystemId: 'exhaust',
    function:
      'Measures residual oxygen content in exhaust gases and sends continuous feedback to the ECU so it can fine-tune the air–fuel mixture for efficiency and low emissions.',
    tags: ['exhaust', 'sensor', 'electronic'],
    relatedComponents: ['catalytic_converter', 'exhaust_manifold', 'fuel_injectors'],
    failureSymptoms: [
      'Check engine light with P0136 or P0141 codes',
      'Engine running noticeably rich or lean',
      'Fuel economy decreasing without obvious cause',
      'Catalytic converter damage from improper mixture',
    ],
    maintenanceNote:
      'Replace upstream and downstream sensors every 60,000–100,000 miles as preventive maintenance.',
  },
  exhaust_pipe: {
    id: 'exhaust_pipe',
    label: 'Exhaust Pipe',
    subsystemId: 'exhaust',
    function:
      'Routes exhaust gases from the catalytic converter rearward to the muffler and out the tailpipe, keeping them safely away from the passenger compartment.',
    tags: ['exhaust'],
    relatedComponents: ['catalytic_converter', 'muffler'],
    failureSymptoms: [
      'Loud rumbling exhaust note indicating a leak',
      'Carbon monoxide risk in the cabin if leaking near the firewall',
      'Visible rust holes or cracks in the pipe',
      'Dragging exhaust contact with the road',
    ],
    maintenanceNote:
      'Inspect for corrosion annually, especially in salt-belt climates. Replace rusted sections before they fail completely.',
  },
  muffler: {
    id: 'muffler',
    label: 'Muffler',
    subsystemId: 'exhaust',
    function:
      'Reduces exhaust noise to legal and comfortable levels through a series of internal chambers, baffles, and resonating tubes that dissipate combustion pressure pulses.',
    tags: ['exhaust', 'noise-reduction'],
    relatedComponents: ['exhaust_pipe', 'catalytic_converter'],
    failureSymptoms: [
      'Noticeably louder exhaust at all RPMs',
      'Rattling from beneath the vehicle (collapsed baffles)',
      'Visible rust holes in the muffler body',
      'Exhaust smell inside the passenger cabin',
    ],
    maintenanceNote:
      'Inspect for corrosion and physical damage. Replace when baffles collapse or rust perforates the shell.',
  },

  // ── Suspension ────────────────────────────────────────────────────────────
  struts: {
    id: 'struts',
    label: 'Struts',
    subsystemId: 'suspension',
    function:
      'Structural load-bearing component that combines a hydraulic shock absorber and coil spring mount into a single assembly, supporting vehicle weight and damping road inputs.',
    tags: ['suspension', 'structural', 'moving'],
    relatedComponents: ['springs', 'wheel_hubs', 'control_arms'],
    failureSymptoms: [
      'Bouncy, wallowing ride over bumps',
      'Nose-dive under braking, squat under acceleration',
      'Uneven or cupped tire wear',
      'Clunking or knocking over rough roads',
    ],
    maintenanceNote:
      'Replace every 50,000 miles or when ride quality noticeably deteriorates. Always replace in matched axle pairs.',
  },
  springs: {
    id: 'springs',
    label: 'Coil Springs',
    subsystemId: 'suspension',
    function:
      "Steel coil springs support the vehicle's static and dynamic weight and absorb road impacts, working in parallel with shock absorbers or struts.",
    tags: ['suspension', 'structural'],
    relatedComponents: ['struts', 'wheel_hubs', 'sway_bar'],
    failureSymptoms: [
      'Vehicle sitting noticeably lower on one side',
      'Harsh, jarring ride quality',
      'Clunking noise over speed bumps',
      'Uneven side-to-side ride height',
    ],
    maintenanceNote:
      'Inspect for cracks or permanent sag. Replace in axle pairs to maintain balanced ride height.',
  },
  control_arms: {
    id: 'control_arms',
    label: 'Control Arms',
    subsystemId: 'suspension',
    function:
      'Pivot links connecting the wheel hub and steering knuckle to the vehicle frame or subframe, allowing vertical wheel travel while precisely maintaining alignment geometry.',
    tags: ['suspension', 'structural'],
    relatedComponents: ['wheel_hubs', 'struts', 'sway_bar'],
    failureSymptoms: [
      'Clunking or knocking noise over bumps',
      'Vibration or shimmy in the steering wheel',
      'Poor straight-line tracking',
      'Uneven or accelerated tire wear',
    ],
    maintenanceNote:
      'Inspect bushings and ball joints annually. Worn bushings cause alignment drift; replace when cracked or torn.',
  },
  wheel_hubs: {
    id: 'wheel_hubs',
    label: 'Wheel Hubs',
    subsystemId: 'suspension',
    function:
      'Central bearing and hub assembly that allows each wheel to rotate freely while supporting the vehicle load. Often integrates the ABS wheel speed sensor ring.',
    tags: ['suspension', 'bearing', 'moving'],
    relatedComponents: ['struts', 'control_arms', 'springs'],
    failureSymptoms: [
      'Humming or grinding noise that changes with vehicle speed',
      'Wheel wobble detected at highway speeds',
      'ABS or traction control warning light',
      'Detectable play when the wheel is rocked by hand',
    ],
    maintenanceNote:
      'Sealed hub units require no lubrication. Replace the entire unit when bearing play or noise is confirmed.',
  },
  sway_bar: {
    id: 'sway_bar',
    label: 'Sway Bar',
    subsystemId: 'suspension',
    function:
      'Torsional steel bar that connects the left and right suspension sides to resist body roll during cornering by equalizing compression across both springs.',
    tags: ['suspension', 'handling'],
    relatedComponents: ['control_arms', 'springs', 'struts'],
    failureSymptoms: [
      'Excessive body roll or lean in corners',
      'Clunking noise when hitting bumps (worn end links)',
      'Vague or wandering steering feel',
      'Uneven tire wear',
    ],
    maintenanceNote:
      'Inspect end links and bushings for wear or cracking. Polyurethane bushings improve over-stock rubber performance.',
  },
};

export const COMPONENT_LIST = Object.values(COMPONENTS);
