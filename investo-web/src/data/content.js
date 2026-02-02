/**
 * Content Data Layer
 * Contains static content for Blogs (Insights) and Methodology
 */

export const BLOG_POSTS = [
  {
    id: 'b-001',
    title: "The End of Discretionary Trading: Why Algorithms Win",
    category: "Market Analysis",
    date: "Oct 12, 2025",
    readTime: "5 min read",
    image: "/images/Whisk_adn5ymnyezyhdjy00sz3qmytmmnirtljddo50iy.png",
    excerpt: "Human emotion is the biggest enemy of ROI. Discover how our deterministic models remove bias from the equation.",
    content: `
      <p>In the high-stakes world of global finance, speed and precision are paramount. The traditional "discretionary" trader—relying on gut instinct and manual execution—is becoming a relic of the past.</p>
      <h3>The Speed Advantage</h3>
      <p>Investoo's execution engines operate in microseconds. While a human trader is still analyzing a headline, our proprietary Nexus-7 engine has already executed thousands of orders across multiple liquidity venues. This latency arbitrage allows us to capture value that is invisible to the naked eye.</p>
      <h3>Removing Emotional Bias</h3>
      <p>Fear and greed drive markets, but they destroy individual portfolios. Algorithms do not feel FOMO (Fear Of Missing Out) or panic during a drawdown. They adhere strictly to pre-defined risk parameters, ensuring that every trade is statistically significant.</p>
      <p>Our backtesting data shows that algorithmic strategies outperform discretionary approaches by an average of 42% in volatile market conditions.</p>
    `
  },
  {
    id: 'b-002',
    title: "Understanding Alpha: How Investoo Generates Excess Returns",
    category: "Education",
    date: "Oct 15, 2025",
    readTime: "7 min read",
    image: "/images/Whisk_ajzxytykdjzijgnh1iy2adotymy3qtlyczy00iy.png",
    excerpt: "Alpha is the holy grail of investing. We demystify the mathematics behind our consistent market outperformance.",
    content: `
      <p>Alpha represents the excess return of an investment relative to the return of a benchmark index. At Investoo, generating Alpha is not an art; it is a science.</p>
      <h3>Multi-Strategy Approach</h3>
      <p>We do not rely on a single strategy. Our portfolios utilize a blend of:</p>
      <ul>
        <li><strong>Statistical Arbitrage:</strong> Exploiting pricing inefficiencies between correlated assets.</li>
        <li><strong>Mean Reversion:</strong> Betting that prices will return to their historical averages.</li>
        <li><strong>Trend Following:</strong> Capitalizing on sustained market momentum.</li>
      </ul>
      <p>By diversifying across these uncorrelated strategies, we smooth out the equity curve and deliver consistent returns regardless of market direction.</p>
    `
  },
  {
    id: 'b-003',
    title: "Risk Parity in Crypto Markets: A Quantitative Approach",
    category: "Risk Management",
    date: "Oct 18, 2025",
    readTime: "6 min read",
    image: "/images/Whisk_kjm4iwm1iwyzqtmy0sn4qwytcjn1qtlinmm10co.png",
    excerpt: "Volatility is a feature, not a bug. Learn how we use advanced variance targeting to manage systematic risk.",
    content: `
      <p>Crypto markets are notoriously volatile. However, volatility creates opportunity if managed correctly. Investoo employs a "Risk Parity" framework, originally pioneered by Bridgewater Associates, adapted for digital assets.</p>
      <p>Instead of allocating capital based on dollar amount, we allocate based on risk contribution. This means highly volatile assets receive a smaller capital allocation, while stable assets receive a larger one. This balances the risk across the entire portfolio.</p>
    `
  },
  {
    id: 'b-004',
    title: "The Role of AI in High-Frequency Arbitrage",
    category: "Technology",
    date: "Oct 22, 2025",
    readTime: "4 min read",
    image: "/images/Whisk_17ecd8f67375b61b3c2465657b835f22dr.jpeg",
    excerpt: "Machine Learning models can predict order flow toxicity. Here is how we use AI to protect your capital.",
    content: `
      <p>High-Frequency Trading (HFT) is an arms race. To stay ahead, Investoo leverages deep learning models to analyze order book pressure in real-time.</p>
      <p>Our "Sentinal" AI module monitors Level 3 order book data to detect "spoofing" and "layering" attempts by predatory traders. When toxic flow is detected, the system automatically widens spreads or halts trading to preserve capital.</p>
    `
  },
  {
    id: 'b-005',
    title: "DeFi Liquidity Provision: Risks and Rewards",
    category: "DeFi",
    date: "Oct 25, 2025",
    readTime: "8 min read",
    image: "/images/Whisk_2d22e80f84872b3846e4fa66c3acf013dr.jpeg",
    excerpt: "Automated Market Making (AMM) is revolutionized finance. We explore our delta-neutral yield farming strategies.",
    content: `
      <p>Decentralized Finance (DeFi) offers yield opportunities far exceeding traditional fixed income. However, Impermanent Loss (IL) is a constant threat.</p>
      <p>Investoo employs "Delta-Neutral" strategies. When we provide liquidity to a Uniswap pool, we simultaneously open a short position on the underlying asset in the futures market. This neutralizes price exposure, allowing us to harvest trading fees without betting on the price of the asset.</p>
    `
  },
  {
    id: 'b-006',
    title: "Institutional Adoption of Digital Assets: 2025 Outlook",
    category: "Macro Outlook",
    date: "Oct 28, 2025",
    readTime: "5 min read",
    image: "/images/Whisk_2fffb5109a06ad1b31f49a385bfa578cdr.jpeg",
    excerpt: "The herd is coming. With ETFs approved and regulatory clarity emerging, institutions are entering the fray.",
    content: `
      <p>2025 marks the year of the Institution. BlackRock, Fidelity, and sovereign wealth funds are now active participants in the digital asset space.</p>
      <p>This influx of capital creates a "rising tide" effect. However, it also reduces volatility. Investoo has adjusted its models to account for this structural shift, moving towards longer-duration trend strategies as the market matures.</p>
    `
  },
  {
    id: 'b-007',
    title: "Backtesting 101: Validating Strategies Before Deployment",
    category: "Education",
    date: "Nov 01, 2025",
    readTime: "10 min read",
    image: "/images/Whisk_65e493b57277712bc7741c749ac7be02dr.jpeg",
    excerpt: "A strategy is only as good as its data. We walk you through our rigorous 5-year walk-forward testing process.",
    content: `
      <p>Before a single dollar of client capital is deployed, every Investoo strategy undergoes a rigorous "Walk-Forward Analysis".</p>
      <p>We train the model on historical data (In-Sample), and then test it on unseen data (Out-of-Sample). If the performance degrades significantly, the strategy is discarded as "overfitted". Only robust, resilient strategies make it to the live portfolio.</p>
    `
  },
  {
    id: 'b-008',
    title: "Security First: How We Protect Your Capital",
    category: "Security",
    date: "Nov 05, 2025",
    readTime: "3 min read",
    image: "/images/Whisk_9e40c28c5f9ca2aa1dc4a79fbd53c1e9dr.jpeg",
    excerpt: "MPC Wallets, Timelocks, and 24/7 Monitoring. Your funds are fortified by bank-grade security infrastructure.",
    content: `
      <p>Security is not an afterthought; it is our foundation. Investoo utilizes Multi-Party Computation (MPC) technology to split private keys into shards distributed across geographically isolated servers.</p>
      <p>Furthermore, all large withdrawals require a 24-hour timelock and manual biometric approval from two senior executives. This "defense in depth" approach ensures that your assets are safe from both external hacks and internal threats.</p>
    `
  },
  {
    id: 'b-009',
    title: "The Mathematics of Market Making",
    category: "Quantitative",
    date: "Nov 09, 2025",
    readTime: "6 min read",
    image: "/images/Whisk_b6ed2a47c3b1a55b9804fde53e03c214dr.jpeg",
    excerpt: "How do you profit from the spread? We dive into the stochastic calculus governing our liquidity provision algorithms.",
    content: `
      <p>Market making is the business of providing liquidity. The profit comes from the bid-ask spread. However, the risk is "Adverse Selection"—buying from a trader who knows more than you.</p>
      <p>Our models avail of the Avellaneda-Stoikov framework to dynamically adjust quotes based on inventory risk and market volatility. This allows us to capture the spread while minimizing the probability of being run over by informed flow.</p>
    `
  },
  {
    id: 'b-010',
    title: "Global Macro Trends Driving Crypto Volatility",
    category: "Macro Outlook",
    date: "Nov 12, 2025",
    readTime: "4 min read",
    image: "/images/Whisk_d1fe9c98efe71378130440d89005714edr.jpeg",
    excerpt: "Interest rates, inflation, and geopolitics. How global macro factors correlate with Bitcoin price action.",
    content: `
      <p>Crypto does not exist in a vacuum. In today's interconnected financial system, Bitcoin is increasingly correlated with the NASDAQ and sensitive to Federal Reserve policy.</p>
      <p>Investoo's "Macro-Overlay" module adjusts our portfolio beta based on the yield curve and inflation expectations. When macro headwinds are strong, we automatically switch to a defensive posture, increasing our allocation to stablecoins.</p>
    `
  }
];

export const METHODOLOGY_CONTENT = [
  {
    title: "Data Ingestion",
    description: "We aggregate real-time L3 market data from 40+ exchanges via low-latency websocket connections.",
    icon: "Database"
  },
  {
    title: "Signal Generation",
    description: "Our proprietary ML models analyze 200+ features (price, volume, sentiment, funding rates) to generate alpha signals.",
    icon: "Cpu"
  },
  {
    title: "Risk Engine Checks",
    description: "Pre-trade risk checks ensure compliance with diversity limits, leverage caps, and VaR (Value at Risk) thresholds.",
    icon: "ShieldAlert"
  },
  {
    title: "Smart Execution",
    description: "Orders are sliced and routed via TWAP/VWAP algorithms to minimize market impact and slippage.",
    icon: "Zap"
  }
];

export const COMPANY_CONTENT = {
  mission: "To democratize access to institutional-grade wealth management through transparent, algorithmic execution.",
  vision: "A world where financial freedom is a product of mathematics, not luck.",
  stats: [
    { label: "Assets Under Management", value: "$4.2B+" },
    { label: "Institutional Clients", value: "850+" },
    { label: "Daily Volume", value: "$120M" },
    { label: "Global Offices", value: "12" }
  ],
  values: [
    {
      title: "Fiduciary Standard",
      description: "We act continuously in the best interest of our clients, placing their financial health above our own profits."
    },
    {
      title: "Radical Transparency",
      description: "Our code is audited, our reserves are proofed, and our fees are explicit. No black boxes."
    },
    {
      title: "First Principles",
      description: "We do not copy. We deconstruct problems to their fundamental truths and build upward."
    }
  ],
  team: [
    {
      name: "Dr. Alexander Vane",
      role: "Chief Executive Officer",
      bio: "Former Head of Quant Strategy at BlackRock. PhD in Stochastic Calculus from MIT.",
      image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=400"
    },
    {
      name: "Sarah Chen",
      role: "CTO & Head of Algo",
      bio: "Architect of the HFT engine at Citadel. 15 years in low-latency systems.",
      image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400"
    },
    {
      name: "Marcus Thorne",
      role: "Chief Risk Officer",
      bio: "Managed risk for a $20B multi-strategy fund. Specialist in tail-risk hedging.",
      image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=400"
    },
    {
      name: "Elena Rodriguez",
      role: "Head of Institutional Sales",
      bio: "Ex-Goldman Sachs Partner. Leads our sovereign wealth fund relationships.",
      image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=400"

    }
  ]
};

export const LEGAL_CONTENT = {
  privacy: {
    title: "Global Privacy Policy",
    lastUpdated: "November 1, 2025",
    content: `
            <p class="lead">At Investoo Inc. ("Investoo", "we", "us", or "our"), preserving the trust of our institutional and individual clients is our highest priority. This Privacy Policy details our commitment to protecting your personal and financial information across our global algorithmic trading infrastructure.</p>
            
            <hr class="my-8 border-white/10" />

            <h3>1. Information We Collect</h3>
            <p>To provide our high-frequency execution and portfolio management services, we may collect the following categories of information:</p>
            <ul class="list-disc pl-6 space-y-2 mb-6 text-white/70">
                <li><strong>Identity Data:</strong> First name, last name, username or similar identifier, marital status, title, date of birth, and gender.</li>
                <li><strong>Contact Data:</strong> Billing address, delivery address, email address, and telephone numbers.</li>
                <li><strong>Financial Data:</strong> Bank account details, payment card details, wallet addresses, and net worth declarations for accreditation.</li>
                <li><strong>Transaction Data:</strong> Details about payments to and from you and other details of products and services you have purchased from us, including trade history and order book interactions.</li>
                <li><strong>Technical Data:</strong> Internet protocol (IP) address, your login data, browser type and version, time zone setting and location, browser plug-in types and versions, operating system and platform, and other technology on the devices you use to access this website.</li>
            </ul>

            <h3>2. How We Use Your Data</h3>
            <p>We rely on sophisticated data models not only for trading but for compliance and security. We use your data to:</p>
            <ul class="list-disc pl-6 space-y-2 mb-6 text-white/70">
                <li><strong>Execute Trades:</strong> Facilitate the clearing and settlement of complex financial instruments.</li>
                <li><strong>Risk Management:</strong> Calibrate our internal risk engines (Nexus-7) to your specific suitability profile.</li>
                <li><strong>Fraud Prevention:</strong> Detect anomalous patterns indicating money laundering or unauthorized access using machine learning classifiers.</li>
                <li><strong>Regulatory Compliance:</strong> Fulfill reporting obligations to bodies such as the SEC, FINRA, FCA, and VARA.</li>
            </ul>

            <h3>3. Data Sovereignty & International Transfers</h3>
            <p>Investoo operates a globally distributed architecture. Your data may be transferred to, stored at, and processed by staff operating outside the European Economic Area (EEA) or your country of residence who work for us or for one of our suppliers. We ensure a similar degree of protection is afforded to it by ensuring at least one of the following safeguards is implemented:</p>
            <ul>
                <li>We will only transfer your personal data to countries that have been deemed to provide an adequate level of protection for personal data.</li>
                <li>Where we use certain service providers, we may use specific contracts approved for use which give personal data the same protection it has in Europe (Standard Contractual Clauses).</li>
            </ul>

            <h3>4. Data Retention</h3>
            <p>We will only retain your personal data for as long as necessary to fulfill the purposes we collected it for, including for the purposes of satisfying any legal, accounting, or reporting requirements. By law, we have to keep basic information about our customers (including Contact, Identity, Financial and Transaction Data) for seven years after they cease being customers.</p>

            <h3>5. Your Legal Rights</h3>
            <p>Under certain circumstances, you have rights under data protection laws in relation to your personal data, including the right to request access, correction, erasure, restriction, transfer, to object to processing, to portability of data, and (where the lawful ground of processing is consent) to withdraw consent.</p>
        `
  },
  terms: {
    title: "Terms and Conditions of Service",
    lastUpdated: "October 15, 2025",
    content: `
            <p class="lead">PLEASE READ THESE TERMS CAREFULLY. BY ACCESSING THE Investoo PLATFORM, YOU AGREE TO BE BOUND BY THESE LEGALLY BINDING TERMS AND CONDITIONS.</p>
            
            <hr class="my-8 border-white/10" />

            <h3>1. Definitions</h3>
            <p>"Platform" refers to the Investoo web interface, API, and mobile applications.</p>
            <p>"Algorithmic Services" refers to the automated execution, rebalancing, and tax-harvesting strategies provided by the Firm.</p>
            <p>"Digital Assets" refers to cryptocurrencies, stablecoins, and tokenized securities supported by the Platform.</p>

            <h3>2. Eligibility and Account Registration</h3>
            <p>The Services are intended solely for users who are 18 or older. By accessing or using the Services, you represent and warrant that you are at least 18 years old and have not previously been suspended or removed from the Services. You represent and warrant that you are not: (a) located in, under the control of, or a national or resident of any country to which the United States has embargoed goods or services; (b) identified as a "Specially Designated National" by the Office of Foreign Assets Control (OFAC); or (c) placed on the U.S. Commerce Department’s Denied Persons List.</p>

            <h3>3. Risks of Algorithmic Trading</h3>
            <div class="bg-red-500/10 border border-red-500/20 p-6 rounded-xl my-6">
                <h4 class="text-red-400 font-bold mb-2">Warning: Significant Capital Risk</h4>
                <p class="text-white/70 text-sm">Trading in financial instruments, including Digital Assets, involves a high degree of risk and is not suitable for all investors. The use of automated trading algorithms ("Bots") does not guarantee profits and usually involves the risk of loss greater than the initial deposit due to leverage and market volatility.</p>
                <ul class="list-disc pl-6 mt-4 space-y-1 text-white/70 text-sm">
                    <li><strong>Market Risk:</strong> Prices of Digital Assets are extremely volatile.</li>
                    <li><strong>Liquidity Risk:</strong> Market conditions may make it difficult or impossible to execute a position at a reasonable price.</li>
                    <li><strong>Software Risk:</strong> Errors in the algorithmic code may result in unintended trades or failure to execute orders.</li>
                </ul>
            </div>

            <h3>4. Indemnification</h3>
            <p>You agree to indemnify, defend and hold harmless Investoo, its affiliates, officers, directors, employees, consultants, agents, and licensors from any and all third party claims, liability, damages and/or costs (including, but not limited to, attorney fees) arising from your use of the Services, your violation of these Terms of Use, or your infringement, or infringement by any other user of your account, of any intellectual property or other right of any person or entity.</p>

            <h3>5. Limitation of Liability</h3>
            <p>IN NO EVENT SHALL Investoo, ITS OFFICERS, DIRECTORS, EMPLOYEES, OR AGENTS, BE LIABLE TO YOU FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, PUNITIVE, OR CONSEQUENTIAL DAMAGES WHATSOEVER RESULTING FROM ANY (I) ERRORS, MISTAKES, OR INACCURACIES OF CONTENT, (II) PERSONAL INJURY OR PROPERTY DAMAGE, OF ANY NATURE WHATSOEVER, RESULTING FROM YOUR ACCESS TO AND USE OF OUR SERVICES, (III) ANY UNAUTHORIZED ACCESS TO OR USE OF OUR SECURE SERVERS AND/OR ANY AND ALL PERSONAL INFORMATION AND/OR FINANCIAL INFORMATION STORED THEREIN.</p>
        `
  },
  security: {
    title: "Security Architecture & Protocol",
    lastUpdated: "December 1, 2025",
    content: `
            <p class="lead">Security is not a feature at Investoo; it is the substrate upon which our entire business is built. We employ a "Defense in Depth" strategy combining cryptographic hardware, rigorous procedure, and adversarial testing.</p>
            
            <hr class="my-8 border-white/10" />

            <h3>1. Infrastructure Security</h3>
            <p>Our infrastructure is hosted across multiple availability zones (AZs) in AWS and GCP, shielded by enterprise-grade WAFs (Web Application Firewalls) and DDoS mitigation services (Cloudflare Enterprise).</p>
            <ul>
                <li><strong>Air-Gapped Cold Storage:</strong> 98% of all digital assets are stored in cold wallets that are wholly disconnected from the internet. Private keys are generated on board FIPS 140-2 Level 3 Hardware Security Modules (HSMs).</li>
                <li><strong>Multi-Party Computation (MPC):</strong> For hot wallet operations, we utilize MPC technology to split private keys into shards. A single shard is never sufficient to sign a transaction; multiple parties must concur.</li>
            </ul>

            <h3>2. Application Security</h3>
            <p>Our codebase undergoes continuous static analysis (SAST) and dynamic analysis (DAST) during the CI/CD pipeline.</p>
            <ul>
                <li><strong>Penetration Testing:</strong> We engage Tier-1 security firms (such as Trail of Bits and OpenZeppelin) to conduct quarterly grey-box penetration tests.</li>
                <li><strong>Bug Bounty Program:</strong> We operate a private bug bounty program on HackerOne with rewards up to $1,000,000 for critical RCE or fund-draining vulnerabilities.</li>
            </ul>

            <h3>3. Operational Security (OpSec)</h3>
            <p>Human error is the single largest attack vector. We mitigate this through enforcing strict internal controls.</p>
            <ul>
                <li><strong>Least Privilege Access:</strong> Employees are granted the minimum level of access necessary to perform their duties. Access is reviewed weekly.</li>
                <li><strong>YubiKey Enforcement:</strong> Hardware 2FA (YubiKey) is mandatory for all access to production environments and administrative panels. SMS 2FA is strictly prohibited.</li>
                <li><strong>Insider Threat Mitigation:</strong> All administrative actions are logged to an immutable audit ledger. High-value transactions require M-of-N consensus from executive officers.</li>
            </ul>
        `
  },
  disclosures: {
    title: "Regulatory Disclosures & Licensing",
    lastUpdated: "January 10, 2026",
    content: `
            <p class="lead">Investoo Inc. is committed to operating within the regulatory frameworks of the jurisdictions in which we offer our services. Transparency is the bedrock of our institutional relationships.</p>

            <hr class="my-8 border-white/10" />

            <h3>1. Registration Status</h3>
            <p>Investoo Inc. is registered as:</p>
            <ul class="list-disc pl-6 space-y-2 mb-6 text-white/70">
                <li><strong>United States:</strong> A Money Services Business (MSB) with FinCEN (Reg #310002345678).</li>
                <li><strong>European Union:</strong> A Virtual Asset Service Provider (VASP) registered with the AMF (France) and BaFin (Germany).</li>
                <li><strong>Dubai:</strong> Fully licensed by the Virtual Assets Regulatory Authority (VARA) to operate crypto-asset exchange and custodian services.</li>
            </ul>

            <h3>2. Order Routing & Best Execution</h3>
            <p>We are legally bound to provide "Best Execution" for our clients. Our Smart Order Router (SOR) queries liquidity from over 40 distinct venues (Centralized Exchanges, Decentralized Exchanges, and OTC Desks) to ensure you receive the optimal price, adjusted for gas fees and slippage.</p>

            <h3>3. Conflicts of Interest</h3>
            <p>Investoo maintains a proprietary trading desk ("Investoo Labs") which trades for the firm's own account. To manage potential conflicts of interest:</p>
            <ul>
                <li><strong>Information Barriers:</strong> Strict "Chinese Walls" separate the client execution desk from the proprietary trading desk. They operate on separate physical floors and separate network subnets.</li>
                <li><strong>No Front Running:</strong> Client orders are always prioritized over firm orders. It is strictly prohibited for the firm using client order information for its own benefit.</li>
            </ul>

            <h3>4. SIPC & FDIC Insurance</h3>
            <p><strong>Important:</strong> Digital assets held in your Investoo account are NOT protected by the Securities Investor Protection Corporation (SIPC) or the Federal Deposit Insurance Corporation (FDIC). While we maintain private commercial crime insurance to cover theft or loss of private keys, you should consider the unique risks of digital assets before investing.</p>
        `
  }
};

export const PLATFORM_CONTENT = {
  marketIntelligence: {
    title: "Market Intelligence",
    subtitle: "See the market through the eyes of an algorithm.",
    features: [
      { title: "Sentiment Analysis", desc: "NLP models scanning 50k+ news sources per second.", icon: "Globe" },
      { title: "On-Chain Analytics", desc: "Tracking whale wallet movements in real-time.", icon: "Activity" },
      { title: "Volatility Surface", desc: "3D visualization of options pricing skew.", icon: "BarChart2" }
    ]
  },
  portfolioConstruction: {
    title: "Portfolio Construction",
    subtitle: "Modern Portfolio Theory, remastered for the digital age.",
    features: [
      { title: "Dynamic Rebalancing", desc: "Automatic adjustment of weights based on volatility.", icon: "RefreshCw" },
      { title: "Tax-Loss Harvesting", desc: "Algorithmic selling to offset capital gains tax.", icon: "TrendingDown" },
      { title: "Direct Indexing", desc: "Own the underlying assets, not just the ETF wrapper.", icon: "Layers" }
    ]
  },
  riskAnalysis: {
    title: "Risk Analysis",
    subtitle: "We don't just manage returns, we engineer survival.",
    features: [
      { title: "Value at Risk (VaR)", desc: "Monte Carlo simulations predicting max drawdown.", icon: "ShieldAlert" },
      { title: "Stress Testing", desc: "Simulating 'Black Swan' events like 2008 or 2020.", icon: "Zap" },
      { title: "Correlation Matrices", desc: "Identifying hidden links between asset classes.", icon: "Grid" }
    ]
  }
};

export const CAREERS_JOBS = [
  //{ title: "Senior Rust Engineer", department: "Execution", location: "Remote / London", type: "Full-Time" },
  //{ title: "Quantitative Researcher", department: "Alpha", location: "New York", type: "Full-Time" },
  //{ title: "Product Designer", department: "Experience", location: "Remote", type: "Contract" },
  //{ title: "Compliance Officer", department: "Legal", location: "Singapore", type: "Full-Time" }
];

export const PRESS_RELEASES = [
  { title: "Investoo raises $42M Series B led by Sequoia", date: "Jan 05, 2026", source: "TechCrunch" },
  { title: "Nexus-7 Engine outperforms S&P 500 for 5th consecutive year", date: "Dec 12, 2025", source: "Bloomberg" },
  { title: "Investoo receives regulatory approval in Dubai (VARA)", date: "Nov 30, 2025", source: "Reuters" }
];
