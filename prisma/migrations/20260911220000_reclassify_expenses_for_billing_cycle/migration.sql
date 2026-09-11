-- Reclassify expenses created before billing-cycle changes started updating
-- existing records. Expense timestamps are stored as UTC without a timezone,
-- so convert them to the application's local date before assigning the cycle.
WITH settings AS (
    SELECT COALESCE(
        (
            SELECT "billingCycleStartDay"
            FROM "AppSettings"
            WHERE "id" = 'default'
        ),
        1
    ) AS start_day
),
expense_dates AS (
    SELECT
        expense."id",
        (
            (expense."date" AT TIME ZONE 'UTC')
            AT TIME ZONE 'America/Sao_Paulo'
        )::date AS local_date,
        settings.start_day
    FROM "Expense" AS expense
    CROSS JOIN settings
),
classified_expenses AS (
    SELECT
        "id",
        CASE
            WHEN EXTRACT(DAY FROM local_date) < LEAST(
                start_day,
                EXTRACT(
                    DAY FROM (
                        DATE_TRUNC('month', local_date)
                        + INTERVAL '1 month - 1 day'
                    )
                )
            )
                THEN TO_CHAR(local_date - INTERVAL '1 month', 'YYYY-MM')
            ELSE TO_CHAR(local_date, 'YYYY-MM')
        END AS month_year
    FROM expense_dates
)
UPDATE "Expense" AS expense
SET "monthYear" = classified.month_year
FROM classified_expenses AS classified
WHERE expense."id" = classified."id"
  AND expense."monthYear" <> classified.month_year;

-- Keep air-conditioning entries in the same cycle as their generated expense.
UPDATE "AirConditioningUsage" AS usage
SET "monthYear" = expense."monthYear"
FROM "Expense" AS expense
WHERE usage."expenseId" = expense."id"
  AND usage."monthYear" <> expense."monthYear";
