// This script will delete all data from treatment_details, treatments, contracts, and customers.
// Ensure your Supabase client has the necessary permissions.

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY; // or service_role_key for bypass RLS

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_ANON_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function clearTestData() {
  console.log("Starting to clear test data...");

  // Delete in order to respect foreign key constraints
  
  // 1. treatment_details
  const { error: error1 } = await supabase.from("treatment_details").delete().neq("id", "00000000-0000-0000-0000-000000000000"); // Dummy condition to delete all
  if (error1) console.error("Error deleting treatment_details:", error1);
  else console.log("Cleared treatment_details");

  // 2. treatments
  const { error: error2 } = await supabase.from("treatments").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  if (error2) console.error("Error deleting treatments:", error2);
  else console.log("Cleared treatments");

  // 3. contracts
  const { error: error3 } = await supabase.from("contracts").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  if (error3) console.error("Error deleting contracts:", error3);
  else console.log("Cleared contracts");

  // 4. customers
  const { error: error4 } = await supabase.from("customers").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  if (error4) console.error("Error deleting customers:", error4);
  else console.log("Cleared customers");

  console.log("Finished clearing test data.");
}

clearTestData();
