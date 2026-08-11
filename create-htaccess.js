import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// ESM does not provide __dirname by default. Create it from import.meta.url.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function generateHtaccess() {
  const outputPath = path.join(__dirname, "out", ".htaccess");

  // Construct the .htaccess content
  const htaccessContent = `<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /
     
    # Dynamic routes (Index pages)
    RewriteRule ^brands/?$ brands/index.html [L]
    RewriteRule ^categories/?$ categories/index.html [L]
    RewriteRule ^delivery-zones/?$ delivery-zones/index.html [L]
    RewriteRule ^feature-sections/?$ feature-sections/index.html [L]
    RewriteRule ^my-account/orders/?$ my-account/orders/index.html [L]
    RewriteRule ^stores/?$ stores/index.html [L]
     
    # Dynamic routes (Slug pages)
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteRule ^brands/([^/]+)/?$ brands/[slug]/index.html [L]

    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteRule ^categories/([^/]+)/?$ categories/[slug]/index.html [L]

    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteRule ^delivery-zones/([^/]+)/?$ delivery-zones/[slug]/index.html [L]

    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteRule ^feature-sections/([^/]+)/?$ feature-sections/[slug]/index.html [L]

    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteRule ^my-account/orders/([^/]+)/?$ my-account/orders/[slug]/index.html [L]

    # Exclude 'search' from products slug rule
    RewriteCond %{REQUEST_URI} !^/products/search
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteRule ^products/([^/]+)/?$ products/[slug]/index.html [L]

    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteRule ^stores/([^/]+)/?$ stores/[slug]/index.html [L]

    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteRule ^share/products/([^/]+)/?$ share/products/[slug]/index.html [L]
    
    # If the request is not for a valid directory
    RewriteCond %{REQUEST_FILENAME} !-d
    # If the request is not for a valid file
    RewriteCond %{REQUEST_FILENAME} !-f
    # If the request is not for a valid link
    RewriteCond %{REQUEST_FILENAME} !-l

    # Rewrite all other URLs to index.html
    RewriteRule . index.html [L]
  </IfModule>`;

  // Write the content to .htaccess file
  fs.writeFileSync(outputPath, htaccessContent.trim());
  console.log(".htaccess file has been generated successfully.");
}

// Call the function to generate .htaccess
generateHtaccess();
