# Assets for the pluralisation cognitive media example

The first Ubikia Media MVP must work without any committed image, music, portrait, logo, or font file.

The default visual output is generated deterministically from text cards.

## Why this directory exists

Future approved assets may be placed here, but every asset must also be declared in `project.yaml` with:

```yaml
- id:
  path:
  kind:
  creator:
  origin_url:
  licence:
  attribution:
  rights_status:
  sha256:
```

## Allowed rights states

```text
owned
licensed
public_domain
permission_granted
private_test_only
```

An asset with unknown rights must not enter a public package.

## Fonts

Do not commit font files merely to make the example easier to run.

The project currently names `DejaVu Sans` as a desired local font family. The implementation must:

1. locate a compatible locally installed font;
2. fail clearly if no configured font can be found;
3. allow the user to provide an explicit local font path through an approved environment-expandable field;
4. never redistribute a font without checking its licence and obtaining human approval.

## Optional future assets

The following may later be added under explicit review:

- a cover portrait or illustration;
- an Institut Mariani or Barons Mariani mark;
- a licensed background texture;
- a waveform style definition;
- a human-recorded intro or outro;
- an approved music bed.

None is required by the MVP.

## Security rule

Do not place private photographs, API responses, credentials, source archives, or generated media masters in this directory.
