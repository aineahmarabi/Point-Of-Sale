import { internalMutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

export const importProducts = internalMutation({
  args: {},
  handler: async (ctx) => {
    // First create categories
    const categories = {
      perfumes: await ctx.db.insert("categories", { name: "Perfumes", slug: "perfumes", status: "active", display_order: 1 }),
      beauty: await ctx.db.insert("categories", { name: "Beauty & Cosmetics", slug: "beauty-cosmetics", status: "active", display_order: 2 }),
      accessories: await ctx.db.insert("categories", { name: "Accessories", slug: "accessories", status: "active", display_order: 3 }),
      party: await ctx.db.insert("categories", { name: "Party & Gifts", slug: "party-gifts", status: "active", display_order: 4 }),
      stationery: await ctx.db.insert("categories", { name: "Stationery", slug: "stationery", status: "active", display_order: 5 }),
      home: await ctx.db.insert("categories", { name: "Home & Decor", slug: "home-decor", status: "active", display_order: 6 }),
      clothing: await ctx.db.insert("categories", { name: "Clothing", slug: "clothing", status: "active", display_order: 7 }),
      bags: await ctx.db.insert("categories", { name: "Bags", slug: "bags", status: "active", display_order: 8 }),
      other: await ctx.db.insert("categories", { name: "Other", slug: "other", status: "active", display_order: 9 }),
    };

    // Then insert all products with correct category mapping and inventory
    const products = [
      { name: "10ml Refill automizers or bottles", slug: "10ml-refill-automizers", selling_price: 700, cost_price: 0, category_id: categories.beauty, status: "active" as const, images: ["https://cdn.shopify.com/s/files/1/0807/4284/2581/files/auto.jpg?v=1780567765"], is_service: false, unit: "piece", tax_rate: 0 },
      { name: "5ml Refill automizers or bottles", slug: "5ml-refill-automizers", selling_price: 500, cost_price: 0, category_id: categories.beauty, status: "active" as const, images: ["https://cdn.shopify.com/s/files/1/0807/4284/2581/files/auto_192b1c1b-674a-4f7c-a11e-0a30ebfcd8eb.jpg?v=1780567874"], is_service: false, unit: "piece", tax_rate: 0 },
      { name: "Azzure Aoud full bottle", slug: "azzure-aoud-full-bottle", selling_price: 3800, cost_price: 0, category_id: categories.perfumes, status: "active" as const, images: ["https://cdn.shopify.com/s/files/1/0807/4284/2581/files/azzureoud.avif?v=1780566823"], is_service: false, unit: "piece", tax_rate: 0 },
      { name: "Beach hats", slug: "beach-hats", selling_price: 1500, cost_price: 0, category_id: categories.accessories, status: "active" as const, images: [], is_service: false, unit: "piece", tax_rate: 0 },
      { name: "Birthday crown", slug: "birthday-crown", selling_price: 500, cost_price: 0, category_id: categories.party, status: "active" as const, images: [], is_service: false, unit: "piece", tax_rate: 0 },
      { name: "Birthday Tags / strips", slug: "birthday-tags-strips", selling_price: 150, cost_price: 0, category_id: categories.party, status: "active" as const, images: ["https://cdn.shopify.com/s/files/1/0807/4284/2581/files/birthdaysash.webp?v=1780574333"], is_service: false, unit: "piece", tax_rate: 0 },
      { name: "Black Addiction", slug: "black-addiction", selling_price: 3000, cost_price: 0, category_id: categories.perfumes, status: "active" as const, images: ["https://cdn.shopify.com/s/files/1/0807/4284/2581/files/blackaddiction.jpg?v=1780576103"], is_service: false, unit: "piece", tax_rate: 0 },
      { name: "Crayons", slug: "crayons", selling_price: 250, cost_price: 0, category_id: categories.stationery, status: "active" as const, images: [], is_service: false, unit: "piece", tax_rate: 0 },
      { name: "Crocks", slug: "crocks", selling_price: 1300, cost_price: 0, category_id: categories.other, status: "active" as const, images: [], is_service: false, unit: "piece", tax_rate: 0 },
      { name: "Discard Wear", slug: "discard-wear", selling_price: 700, cost_price: 0, category_id: categories.clothing, status: "active" as const, images: [], is_service: false, unit: "piece", tax_rate: 0 },
      { name: "Doll Shoes", slug: "doll-shoes", selling_price: 600, cost_price: 0, category_id: categories.other, status: "active" as const, images: [], is_service: false, unit: "piece", tax_rate: 0 },
      { name: "Earings", slug: "earings", selling_price: 100, cost_price: 0, category_id: categories.accessories, status: "active" as const, images: [], is_service: false, unit: "piece", tax_rate: 0 },
      { name: "Gift box", slug: "gift-box", selling_price: 4000, cost_price: 0, category_id: categories.party, status: "active" as const, images: ["https://cdn.shopify.com/s/files/1/0807/4284/2581/files/giftbox.jpg?v=1780574087"], is_service: false, unit: "piece", tax_rate: 0 },
      { name: "Hair Bows", slug: "hair-bows", selling_price: 350, cost_price: 0, category_id: categories.accessories, status: "active" as const, images: ["https://cdn.shopify.com/s/files/1/0807/4284/2581/files/bow.webp?v=1780576606"], is_service: false, unit: "piece", tax_rate: 0 },
      { name: "Hair clips", slug: "hair-clips", selling_price: 350, cost_price: 0, category_id: categories.accessories, status: "active" as const, images: [], is_service: false, unit: "piece", tax_rate: 0 },
      { name: "Joane de amor", slug: "joane-de-amor", selling_price: 700, cost_price: 0, category_id: categories.other, status: "active" as const, images: ["https://cdn.shopify.com/s/files/1/0807/4284/2581/files/joan.jpg?v=1780576289"], is_service: false, unit: "piece", tax_rate: 0 },
      { name: "Key chain", slug: "key-chain", selling_price: 250, cost_price: 0, category_id: categories.accessories, status: "active" as const, images: [], is_service: false, unit: "piece", tax_rate: 0 },
      { name: "Khamra Qahwa full bottle", slug: "khamra-qahwa-full-bottle", selling_price: 3500, cost_price: 0, category_id: categories.perfumes, status: "active" as const, images: ["https://cdn.shopify.com/s/files/1/0807/4284/2581/files/khamrahqahwa.jpg?v=1780567376"], is_service: false, unit: "piece", tax_rate: 0 },
      { name: "Khamrah Durkan full bottle", slug: "khamrah-durkan-full-bottle", selling_price: 3500, cost_price: 0, category_id: categories.perfumes, status: "active" as const, images: ["https://cdn.shopify.com/s/files/1/0807/4284/2581/files/khamrahduk.avif?v=1780567301"], is_service: false, unit: "piece", tax_rate: 0 },
      { name: "Khamrah Lataffa full bottle", slug: "khamrah-lataffa-full-bottle", selling_price: 3500, cost_price: 0, category_id: categories.perfumes, status: "active" as const, images: ["https://cdn.shopify.com/s/files/1/0807/4284/2581/files/khamra.jpg?v=1780567225"], is_service: false, unit: "piece", tax_rate: 0 },
      { name: "Lip liner", slug: "lip-liner", selling_price: 230, cost_price: 0, category_id: categories.beauty, status: "active" as const, images: [], is_service: false, unit: "piece", tax_rate: 0 },
      { name: "Lipgloss", slug: "lipgloss", selling_price: 150, cost_price: 0, category_id: categories.beauty, status: "active" as const, images: [], is_service: false, unit: "piece", tax_rate: 0 },
      { name: "Lipstick", slug: "lipstick", selling_price: 230, cost_price: 0, category_id: categories.beauty, status: "active" as const, images: [], is_service: false, unit: "piece", tax_rate: 0 },
      { name: "Liquid Brun full bottle", slug: "liquid-brun-full-bottle", selling_price: 3500, cost_price: 0, category_id: categories.perfumes, status: "active" as const, images: ["https://cdn.shopify.com/s/files/1/0807/4284/2581/files/liquidbrun.webp?v=1780566653"], is_service: false, unit: "piece", tax_rate: 0 },
      { name: "Male Slides", slug: "male-slides", selling_price: 500, cost_price: 0, category_id: categories.other, status: "active" as const, images: [], is_service: false, unit: "piece", tax_rate: 0 },
      { name: "Mole shoes", slug: "mole-shoes", selling_price: 600, cost_price: 0, category_id: categories.other, status: "active" as const, images: [], is_service: false, unit: "piece", tax_rate: 0 },
      { name: "Notebook", slug: "notebook", selling_price: 800, cost_price: 0, category_id: categories.stationery, status: "active" as const, images: [], is_service: false, unit: "piece", tax_rate: 0 },
      { name: "Photo album", slug: "photo-album", selling_price: 800, cost_price: 0, category_id: categories.home, status: "active" as const, images: [], is_service: false, unit: "piece", tax_rate: 0 },
      { name: "Plain Canvas 40x60 without frame", slug: "plain-canvas-40-60", selling_price: 1000, cost_price: 0, category_id: categories.home, status: "active" as const, images: ["https://cdn.shopify.com/s/files/1/0807/4284/2581/files/40by60.webp?v=1780573787"], is_service: false, unit: "piece", tax_rate: 0 },
      { name: "Play black", slug: "play-black", selling_price: 700, cost_price: 0, category_id: categories.perfumes, status: "active" as const, images: ["https://cdn.shopify.com/s/files/1/0807/4284/2581/files/play.jpg?v=1780576192"], is_service: false, unit: "piece", tax_rate: 0 },
      { name: "Rain coats", slug: "rain-coats", selling_price: 600, cost_price: 0, category_id: categories.clothing, status: "active" as const, images: ["https://cdn.shopify.com/s/files/1/0807/4284/2581/files/rain.jpg?v=1780576696"], is_service: false, unit: "piece", tax_rate: 0 },
      { name: "Ramz Lataffa Full bottle", slug: "ramz-lataffa-full-bottle", selling_price: 2000, cost_price: 0, category_id: categories.perfumes, status: "active" as const, images: ["https://cdn.shopify.com/s/files/1/0807/4284/2581/files/ramz.webp?v=1780567486"], is_service: false, unit: "piece", tax_rate: 0 },
      { name: "Scarf", slug: "scarf", selling_price: 1200, cost_price: 0, category_id: categories.accessories, status: "active" as const, images: [], is_service: false, unit: "piece", tax_rate: 0 },
      { name: "Scented Candles", slug: "scented-candles", selling_price: 500, cost_price: 0, category_id: categories.home, status: "active" as const, images: [], is_service: false, unit: "piece", tax_rate: 0 },
      { name: "School Bags", slug: "school-bags", selling_price: 2500, cost_price: 0, category_id: categories.bags, status: "active" as const, images: [], is_service: false, unit: "piece", tax_rate: 0 },
      { name: "Shoe kit", slug: "shoe-kit", selling_price: 3000, cost_price: 0, category_id: categories.other, status: "active" as const, images: [], is_service: false, unit: "piece", tax_rate: 0 },
      { name: "Suncutters", slug: "suncutters", selling_price: 250, cost_price: 0, category_id: categories.other, status: "active" as const, images: [], is_service: false, unit: "piece", tax_rate: 0 },
      { name: "Taskeen Caramel", slug: "taskeen-caramel", selling_price: 3500, cost_price: 0, category_id: categories.perfumes, status: "active" as const, images: ["https://cdn.shopify.com/s/files/1/0807/4284/2581/files/TaskeenCaramelCascade0_1024x1024_876e75b5-aecb-4e8d-ae40-0e94c45bfecf.webp?v=1780575113"], is_service: false, unit: "piece", tax_rate: 0 },
      { name: "Tote bags", slug: "tote-bags", selling_price: 900, cost_price: 0, category_id: categories.bags, status: "active" as const, images: [], is_service: false, unit: "piece", tax_rate: 0 },
      { name: "Wall clock", slug: "wall-clock", selling_price: 6000, cost_price: 0, category_id: categories.home, status: "active" as const, images: [], is_service: false, unit: "piece", tax_rate: 0 },
      { name: "Yara Lataffa candy", slug: "yara-lataffa-candy", selling_price: 3500, cost_price: 0, category_id: categories.perfumes, status: "active" as const, images: ["https://cdn.shopify.com/s/files/1/0807/4284/2581/files/yara.webp?v=1780574933"], is_service: false, unit: "piece", tax_rate: 0 },
    ];

    // Insert all products
    const productIds: Record<string, Id<"products">> = {};
    for (const product of products) {
      const id = await ctx.db.insert("products", product);
      productIds[product.slug] = id;
    }

    // Insert inventory for each product using CSV quantities
    const inventoryData: Record<string, number> = {
      "10ml-refill-automizers": 20,
      "5ml-refill-automizers": 20,
      "azzure-aoud-full-bottle": 5,
      "beach-hats": 6,
      "birthday-crown": 5,
      "birthday-tags-strips": 9,
      "black-addiction": 2,
      "crayons": 1,
      "crocks": 2,
      "discard-wear": 4,
      "doll-shoes": 7,
      "earings": 60,
      "gift-box": 9,
      "hair-bows": 5,
      "hair-clips": 9,
      "joane-de-amor": 1,
      "key-chain": 4,
      "khamra-qahwa-full-bottle": 5,
      "khamrah-durkan-full-bottle": 5,
      "khamrah-lataffa-full-bottle": 5,
      "lip-liner": 4,
      "lipgloss": 4,
      "lipstick": 19,
      "liquid-brun-full-bottle": 5,
      "male-slides": 1,
      "mole-shoes": 1,
      "notebook": 4,
      "photo-album": 3,
      "plain-canvas-40-60": 2,
      "play-black": 2,
      "rain-coats": 3,
      "ramz-lataffa-full-bottle": 5,
      "scarf": 2,
      "scented-candles": 15,
      "school-bags": 2,
      "shoe-kit": 2,
      "suncutters": 16,
      "taskeen-caramel": 1,
      "tote-bags": 2,
      "wall-clock": 1,
      "yara-lataffa-candy": 2,
    };

    for (const [slug, quantity] of Object.entries(inventoryData)) {
      const productId = productIds[slug];
      if (productId) {
        await ctx.db.insert("inventory", {
          product_id: productId,
          quantity,
          reorder_point: 2,
          reorder_quantity: 5,
        });
      }
    }

    return {
      categoriesCreated: Object.keys(categories).length,
      productsCreated: products.length,
      inventoryCreated: Object.keys(inventoryData).length,
      message: "Import complete!",
    };
  },
});
