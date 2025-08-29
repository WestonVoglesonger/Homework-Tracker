#!/usr/bin/env tsx

import { generateAdminPasswordHash } from "../src/services/adminService";
import { prompt } from "enquirer";

async function setupAdmin() {
  console.log("🔧 Admin Setup Script");
  console.log("===================");
  
  try {
    const response = await prompt<{ adminPassword: string }>({
      type: "password",
      name: "adminPassword",
      message: "Enter the admin password:",
      validate: (input: string) => {
        if (input.length < 8) {
          return "Admin password must be at least 8 characters long";
        }
        return true;
      },
    });

    const hash = await generateAdminPasswordHash(response.adminPassword);
    
    console.log("\n✅ Admin password hash generated successfully!");
    console.log("\nAdd this to your environment variables:");
    console.log(`ADMIN_PASSWORD_HASH="${hash}"`);
    console.log("\nFor development (.env.local):");
    console.log(`echo 'ADMIN_PASSWORD_HASH="${hash}"' >> .env.local`);
    console.log("\nFor production, set this environment variable in your hosting platform.");
    
  } catch (error) {
    console.error("❌ Error setting up admin:", error);
    process.exit(1);
  }
}

if (require.main === module) {
  setupAdmin();
}
