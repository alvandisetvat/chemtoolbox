# Reality rendering upgrade

This revision keeps the existing experiment API and upgrades the shared rendering layer rather than rewriting individual experiments.

## Changes

- Glassware now uses `MeshPhysicalMaterial` with transmission, IOR, thickness and attenuation instead of relying primarily on additive transparent overlays.
- Liquids use physical transmission/attenuation while retaining the existing slosh system and meniscus geometry.
- Lighting is configured for physically-correct light units with a cooler fill light, calibrated exposure and subtle atmospheric depth.
- Contact/placement motion now has a short damped impact response instead of a purely visual bounce.
- The physical glass material is propagated to tubes, beakers, cylinders, funnels, gas-collection glassware and small glass instruments.

## Compatibility

The public experiment APIs were not changed. Existing calls such as `makeBeaker()`, `pour()`, `stirBeaker()` and the experiment step system remain intact.

Three.js remains the existing bundled revision (r160).
