with pause_totals as (
  select
    picking_session_id,
    coalesce(sum(duration_seconds), 0)::integer as pause_seconds
  from public.picking_pauses
  group by picking_session_id
),
base as (
  select
    ps.id,
    greatest(0, round(extract(epoch from (ps.finished_at - ps.started_at)))::integer) as gross_seconds,
    coalesce(pt.pause_seconds, ps.pause_duration_seconds, 0)::integer as pause_seconds,
    ps.planned_packages::numeric as planned_packages,
    ps.expected_packages_per_hour::numeric as expected_packages_per_hour,
    qc.quality_percentage::numeric as quality_percentage
  from public.picking_sessions ps
  left join pause_totals pt on pt.picking_session_id = ps.id
  left join public.quality_controls qc on qc.picking_session_id = ps.id
  where ps.finished_at is not null
    and ps.net_duration_seconds = 0
),
calc as (
  select
    id,
    gross_seconds,
    pause_seconds,
    greatest(0, gross_seconds - pause_seconds) as net_seconds,
    round((planned_packages / expected_packages_per_hour) * 3600)::integer as expected_seconds,
    case
      when greatest(0, gross_seconds - pause_seconds) > 0
      then round(planned_packages / (greatest(0, gross_seconds - pause_seconds)::numeric / 3600), 2)
      else 0
    end as real_packages_per_hour,
    case
      when greatest(0, gross_seconds - pause_seconds) > 0 and expected_packages_per_hour > 0
      then round(((planned_packages / (greatest(0, gross_seconds - pause_seconds)::numeric / 3600)) / expected_packages_per_hour) * 100, 2)
      else 0
    end as productivity_percentage,
    quality_percentage
  from base
)
update public.picking_sessions ps
set
  gross_duration_seconds = calc.gross_seconds,
  pause_duration_seconds = calc.pause_seconds,
  net_duration_seconds = calc.net_seconds,
  real_packages_per_hour = calc.real_packages_per_hour,
  expected_completion_seconds = calc.expected_seconds,
  productivity_percentage = calc.productivity_percentage,
  operational_index = case
    when calc.quality_percentage is not null then round((calc.productivity_percentage * calc.quality_percentage) / 100, 2)
    else ps.operational_index
  end,
  updated_at = now()
from calc
where ps.id = calc.id;
