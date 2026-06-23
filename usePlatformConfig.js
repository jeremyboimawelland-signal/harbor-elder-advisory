import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { PLATFORM_CONFIG_FALLBACK } from "../lib/constants";

/**
 * Reads the live `daily_penalty_rate` from the `platform_config` table rather than
 * hardcoding it in component code — this was flagged explicitly in the build plan
 * (Section 0) as a real annual-update risk if left as a JS constant.
 */
export function usePlatformConfig() {
  const [config, setConfig] = useState(PLATFORM_CONFIG_FALLBACK);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("platform_config")
        .select("*")
        .eq("key", "daily_penalty_rate")
        .maybeSingle();

      if (data) {
        setConfig({
          daily_penalty_rate: Number(data.value),
          jurisdiction: data.jurisdiction,
          effective_year: data.effective_year,
        });
      }
      setLoading(false);
    })();
  }, []);

  return { config, loading };
}
