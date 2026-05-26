# Sheet Setup

Create one Google Sheet per issue, or one master Sheet with a `week_slug` column.

For the current importer, use one export folder with these CSV file names:

```text
issue.csv
this-week.csv
lead-feature.csv
business-units.csv
lessons.csv
sharing.csv
```

Starter CSV files are included in `sheet-templates/`.

## issue.csv

Columns:

```text
field,value
```

Required fields:

- `slug`
- `issueNumber`
- `weekLabel`
- `mastheadHeadline`
- `mastheadDek`

## this-week.csv

Columns:

```text
label,count,text,variant
```

For Design A, This Week usually uses occasion-style items:

- Birthdays
- Events
- Milestones
- Watch

If there is no count, leave `count` blank.

For the current Audrey Design A issue, each row becomes one card inside the stacked This Week occasion deck. Do not create separate old-style cards unless the design is intentionally changed.

## lead-feature.csv

Columns:

```text
field,value
```

Fields:

- `kicker`
- `title`
- `body`
- `image_1`
- `image_2`
- `image_3`
- `image_4`
- `image_5`

Use repo-relative image paths, for example:

```text
assets/images/feature/red-chair.png
```

## business-units.csv

Columns:

```text
unit,text,preview
```

Use one row per business unit note.

## lessons.csv

Columns:

```text
field,value
```

Fields:

- `title`
- `body`
- `image`
- `credit`

## sharing.csv

Columns:

```text
source,index,unit,title,caption,image,url
```

Use one row per LinkedIn/share post.

## Export Rule

Export each tab as CSV into one folder:

```text
sheet-export/
  issue.csv
  this-week.csv
  lead-feature.csv
  business-units.csv
  lessons.csv
  sharing.csv
```

Then run:

```bash
node scripts/import-sheet-export.mjs <week-slug> ./sheet-export
```
