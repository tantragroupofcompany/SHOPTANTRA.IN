export interface ProductVariant {
  type: 'color' | 'size';
  value: string;
  inStock: boolean;
}

export interface Product {
  id: string;
  title: string;
  seller: string;
  sellerId: string;
  price: number;
  originalPrice: number;
  discount: number;
  rating: number;
  reviewsCount: number;
  category: string;
  images: string[];
  description: string;
  stockStatus: 'In Stock' | 'Low Stock' | 'Out of Stock';
  stockCount: number;
  variants: {
    colors?: string[];
    sizes?: string[];
  };
  specifications: Record<string, string>;
  reviews: {
    id: string;
    userName: string;
    rating: number;
    comment: string;
    date: string;
  }[];
}

export const CATEGORIES_LIST = [
  'Electronics',
  'Fashion',
  'Home & Kitchen',
  'Beauty',
  'Grocery',
  'Books',
  'Toys',
  'Sports',
  'Automotive',
  'Mobile Accessories',
  'Furniture',
  'Health'
];

export const mockProducts: Product[] = [
  {
    id: 'prod-1',
    title: 'TantraSound Pro 500 Wireless ANC Headphones',
    seller: 'Tantra Electronics India',
    sellerId: 'sel-1',
    price: 4999,
    originalPrice: 8999,
    discount: 44,
    rating: 4.8,
    reviewsCount: 324,
    category: 'Electronics',
    images: [
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=60',
      'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800&auto=format&fit=crop&q=60',
      'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800&auto=format&fit=crop&q=60'
    ],
    description: 'Immerse yourself in pure audio with the TantraSound Pro 500. Featuring hybrid active noise cancellation (ANC), up to 50 hours of battery life, and crystal-clear call quality with triple mics.',
    stockStatus: 'In Stock',
    stockCount: 45,
    variants: {
      colors: ['Charcoal Black', 'Arctic Silver', 'Navy Blue']
    },
    specifications: {
      'Driver Size': '40mm Dynamic Drivers',
      'ANC Depth': 'Up to 35dB',
      'Bluetooth Version': '5.3',
      'Battery Life': '50 Hours (ANC Off), 35 Hours (ANC On)',
      'Charging Time': '1.5 Hours (Type-C Quick Charge)',
      'Warranty': '1 Year Brand Warranty'
    },
    reviews: [
      { id: 'r1', userName: 'Aman Verma', rating: 5, comment: 'Excellent sound quality and ANC is very good for this price range.', date: '2026-05-12' },
      { id: 'r2', userName: 'Sneha Patel', rating: 4, comment: 'Very comfortable for long hours. Battery life is stellar.', date: '2026-06-01' }
    ]
  },
  {
    id: 'prod-2',
    title: 'Royal Indigo Cotton Kurta Set',
    seller: 'Shiva Designs',
    sellerId: 'sel-2',
    price: 1899,
    originalPrice: 3499,
    discount: 45,
    rating: 4.5,
    reviewsCount: 142,
    category: 'Fashion',
    images: [
      'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=800&auto=format&fit=crop&q=60',
      'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&auto=format&fit=crop&q=60'
    ],
    description: 'Elevate your traditional look with this Royal Indigo Cotton Kurta Set. Crafted from premium breathable cotton, this set includes a straight fit knee-length kurta with delicate embroidery and matching pajamas.',
    stockStatus: 'In Stock',
    stockCount: 120,
    variants: {
      sizes: ['S', 'M', 'L', 'XL', 'XXL'],
      colors: ['Royal Indigo', 'Deep Saffron']
    },
    specifications: {
      'Fabric': '100% Khadi Cotton',
      'Pattern': 'Straight Fit, Embroidered Yoke',
      'Sleeve Length': 'Full Sleeves',
      'Occasion': 'Festive / Semi-Formal',
      'Care Instructions': 'Hand wash separately in cold water'
    },
    reviews: [
      { id: 'r3', userName: 'Rohan Deshmukh', rating: 5, comment: 'Fitting is perfect. Fabric feels extremely premium and light.', date: '2026-05-20' }
    ]
  },
  {
    id: 'prod-3',
    title: '7-in-1 Premium Non-Stick Cookware Set',
    seller: 'Tantra Home & Kitchen',
    sellerId: 'sel-3',
    price: 3499,
    originalPrice: 5999,
    discount: 41,
    rating: 4.6,
    reviewsCount: 98,
    category: 'Home & Kitchen',
    images: [
      'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=800&auto=format&fit=crop&q=60',
      'https://images.unsplash.com/photo-1599940824399-b87987ceb72a?w=800&auto=format&fit=crop&q=60'
    ],
    description: 'Upgrade your kitchen setup with this 7-piece hard-anodized non-stick cookware set. Consists of a Kadai with lid, frying pan, tawa, spatula, and serving ladle. Designed for even heat distribution and minimal oil cooking.',
    stockStatus: 'In Stock',
    stockCount: 30,
    variants: {
      colors: ['Granite Grey', 'Sunset Saffron']
    },
    specifications: {
      'Material': 'Hard-Anodized Aluminium',
      'Coating': '5-Layer Granite Non-Stick Coating',
      'Induction Compatible': 'Yes',
      'Dishwasher Safe': 'Yes',
      'Package Contents': '1 Kadai (2.5L), 1 Frypan (24cm), 1 Tawa (25cm), Lid, 3 Accessories'
    },
    reviews: [
      { id: 'r4', userName: 'Meera Sen', rating: 4, comment: 'Best non-stick pans I have used. Food does not stick and cleaning is super easy.', date: '2026-06-03' }
    ]
  },
  {
    id: 'prod-4',
    title: 'Vitamin C & Hyaluronic Glow Serum',
    seller: 'SkinVeda Ayurveda',
    sellerId: 'sel-4',
    price: 649,
    originalPrice: 1199,
    discount: 45,
    rating: 4.7,
    reviewsCount: 512,
    category: 'Beauty',
    images: [
      'https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=800&auto=format&fit=crop&q=60',
      'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800&auto=format&fit=crop&q=60'
    ],
    description: 'Say goodbye to dark spots and dullness. Formulated with 15% Vitamin C, Ferulic Acid, and Hyaluronic Acid, this serum boosts radiance and intensely hydrates for a youthful skin glow.',
    stockStatus: 'In Stock',
    stockCount: 88,
    variants: {
      sizes: ['30ml', '50ml']
    },
    specifications: {
      'Skin Type': 'All Skin Types',
      'Key Ingredients': 'Ethyl Ascorbic Acid, Kakadu Plum, Hyaluronic Acid',
      'Benefits': 'Brightening, Hydration, Spot Correction',
      'Paraben & Sulphate Free': 'Yes',
      'Certification': 'FDA Approved, Cruelty-Free'
    },
    reviews: [
      { id: 'r5', userName: 'Kriti Sharma', rating: 5, comment: 'Gives an amazing glow in just 2 weeks. Highly recommended!', date: '2026-04-18' }
    ]
  },
  {
    id: 'prod-5',
    title: 'Organic A2 Desi Cow Ghee (Bilona Method)',
    seller: 'Swadeshi Farms',
    sellerId: 'sel-5',
    price: 999,
    originalPrice: 1499,
    discount: 33,
    rating: 4.9,
    reviewsCount: 876,
    category: 'Grocery',
    images: [
      'https://images.unsplash.com/photo-1622484211148-716598e0dbd1?w=800&auto=format&fit=crop&q=60'
    ],
    description: 'Pure, authentic A2 ghee churned from curd curdled from A2 milk of free-grazing Desi Gir cows using the traditional Vedic Bilona method. Highly aromatic, rich in vitamins, and loaded with healthy fats.',
    stockStatus: 'In Stock',
    stockCount: 150,
    variants: {
      sizes: ['500ml', '1 Litre']
    },
    specifications: {
      'Cow Breed': 'Pure Gir Cows',
      'Method': 'Vedic Hand Churned Bilona Process',
      'Container': 'Glass Jar',
      'Shelf Life': '12 Months',
      'Nutritional Benefits': 'Aids Digestion, Boosts Immunity, Natural Antioxidant'
    },
    reviews: [
      { id: 'r6', userName: 'Rajesh V.', rating: 5, comment: 'Reminds me of home. The aroma and grainy texture is top notch!', date: '2026-06-11' }
    ]
  },
  {
    id: 'prod-6',
    title: 'Chanakya Neeti & Indian Wisdom Books Combo',
    seller: 'Vidya Publications',
    sellerId: 'sel-6',
    price: 499,
    originalPrice: 999,
    discount: 50,
    rating: 4.4,
    reviewsCount: 220,
    category: 'Books',
    images: [
      'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800&auto=format&fit=crop&q=60'
    ],
    description: 'A comprehensive paperback collection of ancient Indian strategic thinking, administration, and personal ethics. Includes Chanakya Neeti, Vidur Niti, and Hitopadesh translations in easy-to-understand English & Hindi.',
    stockStatus: 'In Stock',
    stockCount: 65,
    specifications: {
      'Author': 'Ancient Translators Consortium',
      'Publisher': 'Vidya Publications',
      'Language': 'English & Hindi Dual Edition',
      'Binding': 'Paperback',
      'Total Pages': '540 Pages'
    },
    reviews: [
      { id: 'r7', userName: 'Devendra S.', rating: 4, comment: 'Timeless principles. The translation is very modern and easy to read.', date: '2026-05-05' }
    ]
  },
  {
    id: 'prod-7',
    title: 'Smart STEM Robotics kit for Kids (8+)',
    seller: 'Tantra Toys Ltd',
    sellerId: 'sel-7',
    price: 2499,
    originalPrice: 3999,
    discount: 37,
    rating: 4.7,
    reviewsCount: 112,
    category: 'Toys',
    images: [
      'https://images.unsplash.com/photo-1530089785124-1381b6f91448?w=800&auto=format&fit=crop&q=60'
    ],
    description: 'Cultivate logic and engineering curiosity in your child. This STEM kit contains 120+ modular building blocks and simple instruction sets to create up to 10 working robots, controlled via Bluetooth app.',
    stockStatus: 'In Stock',
    stockCount: 20,
    specifications: {
      'Recommended Age': '8 to 14 Years',
      'Learning Value': 'Robotics, Coding Logic, Mechanical Principles',
      'Power Source': '4 AA Batteries required',
      'App Compatibility': 'Android / iOS'
    },
    reviews: [
      { id: 'r8', userName: 'Anjali Gupta', rating: 5, comment: 'My son absolutely loves it. Keeps him engaged and off screens for hours!', date: '2026-06-10' }
    ]
  },
  {
    id: 'prod-8',
    title: 'Vajra Carbon Fiber Badminton Racket Combo',
    seller: 'Vajra Sports',
    sellerId: 'sel-8',
    price: 1599,
    originalPrice: 2999,
    discount: 46,
    rating: 4.6,
    reviewsCount: 184,
    category: 'Sports',
    images: [
      'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=800&auto=format&fit=crop&q=60'
    ],
    description: 'Engineered for dominance on the court. This Vajra racket combo features a high-modulus carbon fiber body, lightweight 4U frame (82g), and high tension capacity (up to 30 lbs) for explosive smashes.',
    stockStatus: 'In Stock',
    stockCount: 40,
    variants: {
      colors: ['Saffron Fire', 'Electric Blue', 'Jet Black']
    },
    specifications: {
      'Material': 'High Modulus Carbon Fiber',
      'Weight': '4U (80-84g)',
      'Grip Size': 'G4',
      'Tension capacity': '24-30 lbs',
      'Package Contents': '2 Rackets, 3 Feather Shuttlecocks, 1 Premium Carrying Bag'
    },
    reviews: [
      { id: 'r9', userName: 'Vikram Singh', rating: 5, comment: 'Extremely lightweight, superb control. Best value racket bundle.', date: '2026-05-28' }
    ]
  },
  {
    id: 'prod-9',
    title: 'UltraClean High-Pressure Car Washer (150 Bar)',
    seller: 'Autocraft Tech',
    sellerId: 'sel-9',
    price: 6499,
    originalPrice: 11999,
    discount: 45,
    rating: 4.5,
    reviewsCount: 205,
    category: 'Automotive',
    images: [
      'https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?w=800&auto=format&fit=crop&q=60'
    ],
    description: 'Get professional car detailing results at home. This high pressure washer features a robust 1800W copper motor, delivering 150 bars of maximum water pressure to blast away mud, grime, and grease from vehicles and patios.',
    stockStatus: 'In Stock',
    stockCount: 15,
    specifications: {
      'Motor Power': '1800 Watts Induction Motor',
      'Max Pressure': '150 Bar',
      'Flow Rate': '6.5 Litres/Min',
      'Hose Pipe Length': '8 Metres Heavy Duty Hose',
      'Weight': '7.2 kg'
    },
    reviews: [
      { id: 'r10', userName: 'Harish K.', rating: 4, comment: 'High pressure, very effective for mud build-up on my SUV. Accessories are good.', date: '2026-06-08' }
    ]
  },
  {
    id: 'prod-10',
    title: 'Premium Metal MagSafe Phone Stand & Ring',
    seller: 'Tantra Accessories',
    sellerId: 'sel-10',
    price: 799,
    originalPrice: 1499,
    discount: 46,
    rating: 4.4,
    reviewsCount: 155,
    category: 'Mobile Accessories',
    images: [
      'https://images.unsplash.com/photo-1616440347437-b1c73416efc2?w=800&auto=format&fit=crop&q=60'
    ],
    description: 'Sleek, secure, and multi-functional. Crafted from high-density zinc alloy, this MagSafe-compatible stand snaps onto the back of your iPhone, providing a secure grip ring, 360-degree rotation stand, and desktop mounting.',
    stockStatus: 'In Stock',
    stockCount: 250,
    variants: {
      colors: ['Metallic Grey', 'Matte Black', 'Rose Gold']
    },
    specifications: {
      'Material': 'Zinc Alloy and N52 Neodymium Magnets',
      'Compatibility': 'iPhone 12 and above (MagSafe native), all devices with metal rings',
      'Rotation': '360° Rotatable, 180° Flip Ring',
      'Thickness': 'Ultra-thin 3mm'
    },
    reviews: [
      { id: 'r11', userName: 'Kabir Lal', rating: 4, comment: 'Magnet is incredibly strong. Rings rotate smoothly. Metal feels premium.', date: '2026-05-19' }
    ]
  },
  {
    id: 'prod-11',
    title: 'Sheesham Wood Solid 3-Seater Sofa',
    seller: 'Royal Wood Krafts',
    sellerId: 'sel-11',
    price: 18499,
    originalPrice: 29999,
    discount: 38,
    rating: 4.7,
    reviewsCount: 78,
    category: 'Furniture',
    images: [
      'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&auto=format&fit=crop&q=60'
    ],
    description: 'Transform your living room with our handcrafted Sheesham Wood Sofa. Showcases beautiful natural wood grains and features thick high-density foam cushions (40-density) upholstered in premium velvet fabric.',
    stockStatus: 'In Stock',
    stockCount: 10,
    variants: {
      colors: ['Teak Finish, Beige Fabric', 'Walnut Finish, Navy Blue Fabric']
    },
    specifications: {
      'Wood Type': '100% Solid Seasoned Sheesham Wood',
      'Seating Capacity': '3 Seater',
      'Cushion Density': '40 Density Foam',
      'Dimensions': '72" W x 30" D x 32" H',
      'Assembly': 'Do-It-Yourself (Easy installation guide provided)'
    },
    reviews: [
      { id: 'r12', userName: 'Ritu Jain', rating: 5, comment: 'Sturdy wood, very comfortable cushions. Looks extremely royal in our hall.', date: '2026-04-30' }
    ]
  },
  {
    id: 'prod-12',
    title: 'TantraPran Ayurvedic Ashwagandha KSM-66 capsules',
    seller: 'AyurHealth Pharma',
    sellerId: 'sel-12',
    price: 899,
    originalPrice: 1499,
    discount: 40,
    rating: 4.8,
    reviewsCount: 422,
    category: 'Health',
    images: [
      'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=800&auto=format&fit=crop&q=60'
    ],
    description: 'Unlock natural strength and mental calm. Formulated with KSM-66, the highest concentration Ashwagandha root extract available. Clinically proven to reduce stress, boost energy, and improve sleep quality.',
    stockStatus: 'In Stock',
    stockCount: 190,
    specifications: {
      'Extract Type': 'KSM-66 Ashwagandha Root Extract (5% Withanolides)',
      'Capsules Count': '60 Vegan Capsules',
      'Serving Size': '1-2 Capsules daily',
      'Certified': 'GMP Certified, USDA Organic, 100% Vegan'
    },
    reviews: [
      { id: 'r13', userName: 'Devang Patel', rating: 5, comment: 'Significant improvement in my sleep cycle and general energy levels. Best Ashwagandha!', date: '2026-06-05' }
    ]
  },
  {
    id: 'prod-13',
    title: '4K Ultra HD Smart LED TV 55 Inch',
    seller: 'Tantra Electronics India',
    sellerId: 'sel-1',
    price: 38999,
    originalPrice: 64999,
    discount: 40,
    rating: 4.6,
    reviewsCount: 180,
    category: 'Electronics',
    images: [
      'https://images.unsplash.com/photo-1593305841991-05c297ba4575?w=800&auto=format&fit=crop&q=60'
    ],
    description: 'Experience spectacular clarity and detail with 4K UHD. Features Dolby Vision, 30W DTS Virtual-X speakers, Google TV interface, and hands-free voice control.',
    stockStatus: 'In Stock',
    stockCount: 12,
    specifications: {
      'Display': '4K UHD, HDR10+, Dolby Vision',
      'Sound Output': '30 Watts Dolby Audio',
      'OS': 'Google TV with Play Store',
      'Refresh Rate': '60 Hz',
      'Ports': '3 HDMI, 2 USB, Dual-band Wi-Fi'
    },
    reviews: [
      { id: 'r14', userName: 'Pranav M.', rating: 5, comment: 'Phenomenal display and UI is butter smooth. Best budget 55 inch TV!', date: '2026-05-15' }
    ]
  },
  {
    id: 'prod-14',
    title: 'Waterproof Leather Hiking Shoes',
    seller: 'Vajra Sports',
    sellerId: 'sel-8',
    price: 3499,
    originalPrice: 5999,
    discount: 41,
    rating: 4.7,
    reviewsCount: 88,
    category: 'Sports',
    images: [
      'https://images.unsplash.com/photo-1539185441755-769473a23570?w=800&auto=format&fit=crop&q=60'
    ],
    description: 'Engineered for rugged trails. These hiking shoes feature water-resistant nubuck leather, a breathable mesh interior lining, and dual-density EVA midsoles for all-day comfort and stability.',
    stockStatus: 'In Stock',
    stockCount: 22,
    variants: {
      sizes: ['7', '8', '9', '10', '11']
    },
    specifications: {
      'Material': 'Nubuck Leather & TPU Sole',
      'Waterproof': 'Yes (HydroGuard Membrane)',
      'Sole Type': 'Vibram Traction Outsole',
      'Weight': '450g per shoe'
    },
    reviews: [
      { id: 'r15', userName: 'Sanjay Dutt', rating: 5, comment: 'Hiked in Himachal with these. Feet remained completely dry and grip is amazing.', date: '2026-06-09' }
    ]
  },
  {
    id: 'prod-15',
    title: 'Glacial Cooling Hydro Flask (1.2L)',
    seller: 'Eco Living',
    sellerId: 'sel-13',
    price: 1299,
    originalPrice: 1999,
    discount: 35,
    rating: 4.8,
    reviewsCount: 310,
    category: 'Home & Kitchen',
    images: [
      'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=800&auto=format&fit=crop&q=60'
    ],
    description: 'Double-walled vacuum insulated flask that keeps drinks ice cold for up to 24 hours and hot for 12 hours. Crafted from premium 18/8 food-grade stainless steel with sweat-free powder coating.',
    stockStatus: 'In Stock',
    stockCount: 95,
    variants: {
      colors: ['Obsidian Black', 'Glacier Teal', 'Saffron Flame']
    },
    specifications: {
      'Material': '18/8 Pro-Grade Stainless Steel',
      'Insulation': 'TempShield Double Wall Vacuum',
      'Capacity': '1200 ml',
      'BPA Free': 'Yes'
    },
    reviews: [
      { id: 'r16', userName: 'Nikhil Roy', rating: 4, comment: 'Insulation works perfectly. Saffron color looks absolutely stunning!', date: '2026-05-30' }
    ]
  },
  {
    id: 'prod-16',
    title: 'Glow-Up Hydrating Lip Oil Tint',
    seller: 'Beauty Naturals',
    sellerId: 'sel-14',
    price: 499,
    originalPrice: 899,
    discount: 44,
    rating: 4.5,
    reviewsCount: 190,
    category: 'Beauty',
    images: [
      'https://images.unsplash.com/photo-1625093742435-6fa192b6fb10?w=800&auto=format&fit=crop&q=60'
    ],
    description: 'Formulated with organic Jojoba, Rosehip, and Almond oils. Nourishes dry lips like a balm while delivering a beautiful high-gloss pink tint and plumpness without being sticky.',
    stockStatus: 'In Stock',
    stockCount: 130,
    variants: {
      colors: ['Rosy Coral', 'Saffron Glow', 'Berry Mauve']
    },
    specifications: {
      'Key Ingredients': 'Jojoba Oil, Vitamin E, Rosehip Extract',
      'Texture': 'Non-sticky lightweight oil-gel',
      'Benefits': 'Moisturizes, Plumps, Leaves a long lasting tint',
      'Volume': '6 ml'
    },
    reviews: [
      { id: 'r17', userName: 'Ananya Roy', rating: 4, comment: 'Tint is subtle but lasts very long. Keeps lips hydrated for hours.', date: '2026-06-12' }
    ]
  },
  {
    id: 'prod-17',
    title: 'Premium Cold Pressed Mustard Oil (1L)',
    seller: 'Swadeshi Farms',
    sellerId: 'sel-5',
    price: 249,
    originalPrice: 349,
    discount: 28,
    rating: 4.8,
    reviewsCount: 380,
    category: 'Grocery',
    images: [
      'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=800&auto=format&fit=crop&q=60'
    ],
    description: '100% pure yellow mustard oil cold-pressed in wooden Kolhu at low temperatures. Retains original pungency, nutrients, and natural antioxidants. Essential for authentic Indian cooking.',
    stockStatus: 'In Stock',
    stockCount: 400,
    specifications: {
      'Extraction Method': 'Wooden Kolhu Cold Pressed (Kachi Ghani)',
      'Mustard Type': 'Yellow Mustard Seeds',
      'Cholesterol Free': 'Yes',
      'Pack Size': '1 Litre bottle'
    },
    reviews: [
      { id: 'r18', userName: 'Mamta D.', rating: 5, comment: 'Very high quality mustard oil. Pure aroma, excellent for pickle making.', date: '2026-06-14' }
    ]
  },
  {
    id: 'prod-18',
    title: 'The Alchemist (Premium Deluxe Edition)',
    seller: 'Vidya Publications',
    sellerId: 'sel-6',
    price: 349,
    originalPrice: 599,
    discount: 41,
    rating: 4.9,
    reviewsCount: 1205,
    category: 'Books',
    images: [
      'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=800&auto=format&fit=crop&q=60'
    ],
    description: 'Paulo Coelho\'s masterpiece about Santiago, an Andalusian shepherd boy who journeys to find a worldly treasure. This special edition features premium hardbound binding and custom gold-foiled illustrations.',
    stockStatus: 'In Stock',
    stockCount: 80,
    specifications: {
      'Author': 'Paulo Coelho',
      'Publisher': 'HarperCollins',
      'Format': 'Hardcover Gift Edition',
      'Genre': 'Fiction / Allegory'
    },
    reviews: [
      { id: 'r19', userName: 'Rahul G.', rating: 5, comment: 'A book everyone should read. The cover design on this deluxe edition is spectacular.', date: '2026-05-24' }
    ]
  },
  {
    id: 'prod-19',
    title: 'Interactive Wooden Kitchen Playset',
    seller: 'Tantra Toys Ltd',
    sellerId: 'sel-7',
    price: 3299,
    originalPrice: 5499,
    discount: 40,
    rating: 4.6,
    reviewsCount: 65,
    category: 'Toys',
    images: [
      'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=800&auto=format&fit=crop&q=60'
    ],
    description: 'Delight young chefs. Handcrafted from eco-friendly pine wood and painted with non-toxic water-based paints. Includes microwave, stove, sink, kitchen clock, and 5 metal cookware accessories.',
    stockStatus: 'In Stock',
    stockCount: 15,
    specifications: {
      'Material': 'Pine Wood, Plywood (Eco-friendly)',
      'Dimensions': '24" L x 12" W x 32" H',
      'Age Recommendation': '3 Years and above',
      'Certifications': 'EN71 Safety Standard Certified'
    },
    reviews: [
      { id: 'r20', userName: 'Pallavi S.', rating: 5, comment: 'Outstanding craftsmanship. Paint is smooth and wood has no sharp edges.', date: '2026-06-02' }
    ]
  },
  {
    id: 'prod-20',
    title: 'Dual-Cylinder Rapid Tyre Inflator (150 PSI)',
    seller: 'Autocraft Tech',
    sellerId: 'sel-9',
    price: 2299,
    originalPrice: 3999,
    discount: 42,
    rating: 4.7,
    reviewsCount: 190,
    category: 'Automotive',
    images: [
      'https://images.unsplash.com/photo-1507136566006-cfc505b114fc?w=800&auto=format&fit=crop&q=60'
    ],
    description: 'An emergency essential. This heavy-duty dual-cylinder compressor operates on 12V DC, inflating a standard car tyre in under 2 minutes. Includes high-precision digital gauge, LED light, and auto-shutoff.',
    stockStatus: 'In Stock',
    stockCount: 50,
    specifications: {
      'Power Source': '12V DC (Car Cigarette Lighter / Battery Clamps)',
      'Max Pressure': '150 PSI',
      'Air Flow Rate': '50 Litres/Min',
      'Display': 'Digital Backlit LCD with presets',
      'Safety Features': 'Auto-Shutoff, Overheat Protection'
    },
    reviews: [
      { id: 'r21', userName: 'Siddharth R.', rating: 4, comment: 'Inflates my SUV tyres extremely fast. Gauge is accurate and LED flashlight is helpful at night.', date: '2026-05-18' }
    ]
  },
  {
    id: 'prod-21',
    title: 'USB-C GaN Rapid Charger (65W 3-Port)',
    seller: 'Tantra Accessories',
    sellerId: 'sel-10',
    price: 1499,
    originalPrice: 2999,
    discount: 50,
    rating: 4.8,
    reviewsCount: 310,
    category: 'Mobile Accessories',
    images: [
      'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=800&auto=format&fit=crop&q=60'
    ],
    description: 'Charge your laptop, tablet, and phone simultaneously. Powered by Gallium Nitride (GaN) technology, this charger delivers up to 65W output while being 50% smaller than standard chargers.',
    stockStatus: 'In Stock',
    stockCount: 140,
    specifications: {
      'Technology': 'Gallium Nitride (GaN) Tech',
      'Output Ports': '2 x USB-C (PD 3.0), 1 x USB-A (QC 4.0)',
      'Max Output': '65W Power Delivery',
      'Safety Certs': 'BIS Certified, Short-Circuit & Over-Current Protection'
    },
    reviews: [
      { id: 'r22', userName: 'Vinay T.', rating: 5, comment: 'Easily charges my MacBook Air and iPhone fast at the same time. Very compact!', date: '2026-06-12' }
    ]
  },
  {
    id: 'prod-22',
    title: 'Wingback Ergonomic Home Office Chair',
    seller: 'Royal Wood Krafts',
    sellerId: 'sel-11',
    price: 8499,
    originalPrice: 14999,
    discount: 43,
    rating: 4.6,
    reviewsCount: 142,
    category: 'Furniture',
    images: [
      'https://images.unsplash.com/photo-1505797149-43b0069ec26b?w=800&auto=format&fit=crop&q=60'
    ],
    description: 'Designed for long working hours. Features a tall breathable mesh backrest, adjustable 3D lumber support, height-adjustable padded armrests, tilt-lock mechanism, and heavy-duty nylon wheelbase.',
    stockStatus: 'In Stock',
    stockCount: 18,
    variants: {
      colors: ['Charcoal Black', 'Arctic Grey', 'Royal Saffron Accent']
    },
    specifications: {
      'Backrest Type': 'Breathable Nylon Mesh & PP Frame',
      'Tilt Range': '90° to 135° Recline',
      'Gas Lift Class': 'Class 4 Heavy Duty',
      'Weight capacity': 'Up to 135 kg'
    },
    reviews: [
      { id: 'r23', userName: 'Pradeep J.', rating: 4, comment: 'Lumber support is fantastic. Mesh keeps my back sweat-free. Very solid build.', date: '2026-06-04' }
    ]
  },
  {
    id: 'prod-23',
    title: 'Instant-Read Digital Arm BP Monitor',
    seller: 'AyurHealth Pharma',
    sellerId: 'sel-12',
    price: 1799,
    originalPrice: 2999,
    discount: 40,
    rating: 4.5,
    reviewsCount: 230,
    category: 'Health',
    images: [
      'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800&auto=format&fit=crop&q=60'
    ],
    description: 'Monitor your health accurately. This fully automatic blood pressure monitor uses oscillometric measurement to deliver fast, highly accurate readings. Features standard large cuff, voice broadcast, and irregular heartbeat alert.',
    stockStatus: 'In Stock',
    stockCount: 110,
    specifications: {
      'Cuff Size': 'Universal 22-42 cm cuff',
      'Display': 'Extra Large Backlit LCD Screen',
      'Memory': 'Dual Users, 90 sets of readings each',
      'Power Source': '4 AAA Batteries or Type-C Cable support'
    },
    reviews: [
      { id: 'r24', userName: 'Anil Chawla', rating: 5, comment: 'Reads very quickly and matching close to clinic readings. Backlight is very nice for elderly.', date: '2026-05-14' }
    ]
  },
  {
    id: 'prod-24',
    title: 'Pure Premium Organic Saffron / Kesar (1g)',
    seller: 'Swadeshi Farms',
    sellerId: 'sel-5',
    price: 349,
    originalPrice: 699,
    discount: 50,
    rating: 4.9,
    reviewsCount: 654,
    category: 'Grocery',
    images: [
      'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=800&auto=format&fit=crop&q=60'
    ],
    description: '100% pure Grade-A original Kashmiri Mongra saffron threads. Handpicked carefully from fresh saffron flowers of Pampore fields. Deep red color, potent aroma, and rich medicinal properties.',
    stockStatus: 'In Stock',
    stockCount: 300,
    specifications: {
      'Grade': 'Grade A+ Mongra Saffron',
      'Harvesting Season': 'Fresh Harvest Pampore',
      'Packaging': 'Airtight acrylic gift box',
      'Net Weight': '1 Gram'
    },
    reviews: [
      { id: 'r25', userName: 'Sunita Joshi', rating: 5, comment: 'Incredible aroma and deep golden color. The best quality Kesar I have purchased online.', date: '2026-06-15' }
    ]
  }
];
