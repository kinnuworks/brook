Validator: HL7 FHIR Validator 6.10.4 · FHIR 4.0.1 · terminology https://tx.fhir.org · 2026-10-02

| File | Expected | Errors | Warnings | Result |
|---|---|---:|---:|---|
| `bundles/a-citizen-check-o17.json` | valid | 0 | 0 | ✅ valid as expected |
| `bundles/b-verified-check-o17.json` | valid | 0 | 0 | ✅ valid as expected |
| `bundles/c-custom-site.json` | valid | 0 | 0 | ✅ valid as expected |
| `bundles/broken-1-unknown-answer-code.json` | invalid | 1 | 0 | ✅ invalid as expected |
| `bundles/broken-2-verified-without-performer.json` | invalid | 1 | 1 | ✅ invalid as expected |
| `bundles/broken-3-preliminary-claims-oah-profile.json` | invalid | 1 | 0 | ✅ invalid as expected |
| `bundles/broken-4-form-answer-wrong-type.json` | invalid | 1 | 0 | ✅ invalid as expected |
| `bundles/gap-location-referenceForm.json` | probe | 1 | 0 | probe: invalid |
| `public/fhir/CodeSystem-answer-source.json` | valid | 0 | 0 | ✅ valid as expected |
| `public/fhir/CodeSystem-oah-citizen-answers.json` | valid | 0 | 0 | ✅ valid as expected |
| `public/fhir/CodeSystem-oah-citizen-fields.json` | valid | 0 | 0 | ✅ valid as expected |
| `public/fhir/CodeSystem-tags.json` | valid | 0 | 0 | ✅ valid as expected |
| `public/fhir/ConceptMap-oah-citizen-fields-to-oah-indicators.json` | valid | 0 | 0 | ✅ valid as expected |
| `public/fhir/Questionnaire-oah-citizen-check.json` | valid | 0 | 0 | ✅ valid as expected |
| `public/fhir/StructureDefinition-answer-source.json` | valid | 0 | 0 | ✅ valid as expected |
| `public/fhir/ValueSet-answer-source.json` | valid | 0 | 0 | ✅ valid as expected |
| `public/fhir/ValueSet-oah-citizen-fields.json` | valid | 0 | 0 | ✅ valid as expected |

**bundles/broken-1-unknown-answer-code.json**

- error `Unknown_Code_in_Version` at `Bundle.entry[2].resource/*Observation/40b827c7-5b0e-4c1e-af4a-4c7e9d3b6a1f*/.component[0].value.ofType(CodeableConcept).coding[0].code`: Unknown code 'channelForm.W' in the CodeSystem 'https://brook-oah.vercel.app/fhir/CodeSystem/oah-citizen-answers' version '0.1.0'

**bundles/broken-2-verified-without-performer.json**

- warning `All_observations_should_have_a_performer` at `Bundle.entry[3].resource/*Observation/3fb82634-5b0e-4c1e-af4a-4c7e9d3b6a1f*/`: Best Practice Recommendation: In general, all observations should have a performer
- error `Validation_VAL_Profile_Minimum` at `Bundle.entry[3].resource/*Observation/3fb82634-5b0e-4c1e-af4a-4c7e9d3b6a1f*/`: Observation.performer: minimum required = 1, but only found 0 (from http://hl7.eu/fhir/ig/oah/StructureDefinition/observation-indicators-oah)

**bundles/broken-3-preliminary-claims-oah-profile.json**

- error `_DT_Fixed_Wrong` at `Bundle.entry[3].resource/*Observation/3fb82634-5b0e-4c1e-af4a-4c7e9d3b6a1f*/.status`: Value is 'preliminary' but is fixed to 'final' in the profile http://hl7.eu/fhir/ig/oah/StructureDefinition/observation-indicators-oah#Observation.status

**bundles/broken-4-form-answer-wrong-type.json**

- error `Questionnaire_QR_Item_WrongType` at `Bundle.entry[1].resource/*QuestionnaireResponse/8754ec94-5b0e-4c1e-af4a-4c7e9d3b6a1f*/.item[13].answer[0].value.ofType(string)`: Answer value must be of the type decimal not string

**bundles/gap-location-referenceForm.json**

- error `Extension_EXTP_Context_Wrong_VER` at `Bundle.entry[0].resource/*Location/oah-site-o17*/`: The extension http://hl7.org/fhir/StructureDefinition/artifact-relatedArtifact v5.3.0 is not allowed to be used at this point (this element is [Bundle.entry.resource, Bundle.entry.resource/*Location/oah-site-o17*/, Location]; allowed for this version = e:CapabilityStatement, e:CodeSystem, e:CompartmentDefinition, e:Composition, e:ConceptMap, e:DeviceDefinition, e:ExampleScenario, e:GraphDefinition, e:Group, e:ImplementationGuide, e:Medication, e:MedicationKnowledge, e:MessageDefinition, e:NamingSystem, e:ObservationDefinition, e:OperationDefinition, e:Questionnaire, e:SearchParameter, e:SpecimenDefinition, e:Substance, e:StructureDefinition, e:StructureMap, e:TerminologyCapabilities, e:ValueSet)

Information, bundles/b-verified-check-o17.json:

- 26× None of the codings provided are in the value set 'OAH Indicators (Non-Health)' (http://hl7.eu/fhir/ig/oah/ValueSet/oah-indicators-no-health-oah-vs), and a coding is recommended to come from this value set

Information, bundles/broken-2-verified-without-performer.json:

- 26× None of the codings provided are in the value set 'OAH Indicators (Non-Health)' (http://hl7.eu/fhir/ig/oah/ValueSet/oah-indicators-no-health-oah-vs), and a coding is recommended to come from this value set

Information, bundles/broken-3-preliminary-claims-oah-profile.json:

- 5× None of the codings provided are in the value set 'OAH Indicators (Non-Health)' (http://hl7.eu/fhir/ig/oah/ValueSet/oah-indicators-no-health-oah-vs), and a coding is recommended to come from this value set

Information, bundles/gap-location-referenceForm.json:

- 8× Details for Location/oah-site-o17 matching against profile http://hl7.org/fhir/StructureDefinition/Location\|4.0.1

Information, public/fhir/CodeSystem-oah-citizen-answers.json:

- 1× This property has only a code ('field') and not a URI, so it has no clearly defined meaning in the terminology ecosystem
- 1× This property has only a code ('appValue') and not a URI, so it has no clearly defined meaning in the terminology ecosystem

