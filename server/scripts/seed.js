import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Supabase setup
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const tools = [
    {
        name: "GitHub",
        url: "https://github.com",
        summary: "A platform for version control and collaboration. Host and review code, manage projects, and build software alongside millions of developers.",
        categories: ["development", "collaboration", "devops"]
    },
    {
        name: "VS Code",
        url: "https://code.visualstudio.com",
        summary: "A lightweight but powerful source code editor. Comes with built-in support for JavaScript, TypeScript and Node.js and has a rich ecosystem of extensions.",
        categories: ["development", "productivity", "editor"]
    },
    {
        name: "Figma",
        url: "https://figma.com",
        summary: "A collaborative interface design tool. Create, test, and ship better designs from start to finish. Design, prototype, and gather feedback all in one place.",
        categories: ["design", "collaboration", "productivity"]
    },
    {
        name: "MongoDB",
        url: "https://mongodb.com",
        summary: "A document database with the scalability and flexibility that you want with the querying and indexing that you need. Designed to help developers build and scale applications.",
        categories: ["database", "cloud", "development"]
    },
    {
        name: "Postman",
        url: "https://postman.com",
        summary: "A collaboration platform for API development. Simplify each step of building an API and streamline collaboration so you can create better APIs faster.",
        categories: ["development", "testing", "api"]
    },
    {
        name: "Docker",
        url: "https://docker.com",
        summary: "A platform for developing, shipping, and running applications in containers. Separate applications from infrastructure for fast software delivery.",
        categories: ["devops", "development", "cloud"]
    },
    {
        name: "Slack",
        url: "https://slack.com",
        summary: "A business communication platform. Real-time messaging, archiving and search for modern teams. Integrate with the tools you already use.",
        categories: ["communication", "collaboration", "productivity"]
    },
    {
        name: "Notion",
        url: "https://notion.so",
        summary: "All-in-one workspace for notes, docs, wikis, projects, and collaboration. Write, plan, collaborate, and get organized in one place.",
        categories: ["productivity", "documentation", "collaboration"]
    },
    {
        name: "AWS",
        url: "https://aws.amazon.com",
        summary: "Comprehensive cloud computing platform. Offering over 200 fully featured services from data centers globally for building sophisticated applications.",
        categories: ["cloud", "devops", "development"]
    },
    {
        name: "Jira",
        url: "https://www.atlassian.com/software/jira",
        summary: "Project and issue tracking software. Plan, track, and manage agile and software development projects with customizable workflows.",
        categories: ["productivity", "collaboration", "project-management"]
    },
    {
        name: "ChatGPT",
        url: "https://chat.openai.com",
        summary: "Advanced AI language model for conversation and assistance. Helps with writing, analysis, coding, and answering questions across various domains.",
        categories: ["ai", "productivity", "development"]
    },
    {
        name: "Kubernetes",
        url: "https://kubernetes.io",
        summary: "Open-source container orchestration platform. Automate deployment, scaling, and management of containerized applications.",
        categories: ["devops", "cloud", "automation"]
    },
    {
        name: "Grafana",
        url: "https://grafana.com",
        summary: "Open-source analytics and monitoring solution. Query, visualize, alert on, and understand your metrics from multiple data sources.",
        categories: ["monitoring", "analytics", "devops"]
    },
    {
        name: "Stripe",
        url: "https://stripe.com",
        summary: "Payment processing platform for internet businesses. APIs and tools for accepting payments, sending payouts, and managing online businesses.",
        categories: ["development", "finance", "api"]
    },
    {
        name: "Vercel",
        url: "https://vercel.com",
        summary: "Platform for frontend frameworks and static sites. Deploy web projects with zero configuration, automatic SSL, and global CDN.",
        categories: ["development", "deployment", "cloud"]
    },
    {
        name: "Linear",
        url: "https://linear.app",
        summary: "Issue tracking tool built for high-performance teams. Streamline software projects, sprints, tasks, and bug tracking.",
        categories: ["productivity", "project-management", "collaboration"]
    },
    {
        name: "Supabase",
        url: "https://supabase.com",
        summary: "Open source Firebase alternative. Create a backend in less than 2 minutes with realtime subscriptions, authentication, and storage.",
        categories: ["development", "database", "backend"]
    },
    {
        name: "Cloudflare",
        url: "https://cloudflare.com",
        summary: "Web infrastructure and security company. Provide content delivery network services, DDoS mitigation, Internet security, and DNS services.",
        categories: ["security", "cloud", "networking"]
    },
    {
        name: "GitLab",
        url: "https://gitlab.com",
        summary: "Complete DevOps platform. Plan, create, verify, package, release, configure, monitor, and secure your applications.",
        categories: ["development", "devops", "collaboration"]
    },
    {
        name: "Datadog",
        url: "https://datadoghq.com",
        summary: "Monitoring and analytics platform. Monitor your entire technology stack with infrastructure monitoring, application performance monitoring, log management, and user experience monitoring.",
        categories: ["monitoring", "analytics", "devops"]
    },
    {
        name: "Auth0",
        url: "https://auth0.com",
        summary: "Authentication and authorization platform. Add authentication to applications with multiple identity providers and secure access for users.",
        categories: ["security", "development", "api"]
    },
    {
        name: "Miro",
        url: "https://miro.com",
        summary: "Online collaborative whiteboarding platform. Work together on brainstorming, process mapping, UX research, agile workflows, and more.",
        categories: ["collaboration", "design", "productivity"]
    },
    {
        name: "Sentry",
        url: "https://sentry.io",
        summary: "Application monitoring and error tracking software. Track, monitor, and fix crashes in your applications in real time.",
        categories: ["monitoring", "development", "debugging"]
    },
    {
        name: "Retool",
        url: "https://retool.com",
        summary: "Platform for building internal tools. Build custom internal software faster with pre-built components and direct database access.",
        categories: ["development", "productivity", "automation"]
    },
    {
        name: "Twilio",
        url: "https://twilio.com",
        summary: "Cloud communications platform. Add messaging, voice, and video to your applications with APIs for SMS, voice, video, and authentication.",
        categories: ["communication", "api", "development"]
    },
    {
        name: "Webflow",
        url: "https://webflow.com",
        summary: "Visual web development platform. Design, build, and launch responsive websites visually while generating clean, semantic code.",
        categories: ["design", "development", "no-code"]
    },
    {
        name: "New Relic",
        url: "https://newrelic.com",
        summary: "Observability platform for software engineers. Monitor, debug, and improve your entire technology stack with full-stack observability.",
        categories: ["monitoring", "devops", "analytics"]
    },
    {
        name: "Asana",
        url: "https://asana.com",
        summary: "Work management platform. Organize team projects, manage tasks, track progress, and achieve goals together.",
        categories: ["productivity", "collaboration", "project-management"]
    },
    {
        name: "Netlify",
        url: "https://netlify.com",
        summary: "Platform for modern web development. Build, deploy, and scale modern web applications with serverless functions and continuous deployment.",
        categories: ["development", "deployment", "cloud"]
    },
    {
        name: "Zapier",
        url: "https://zapier.com",
        summary: "Automation platform for connecting apps and workflows. Connect your apps and automate workflows without coding.",
        categories: ["automation", "productivity", "integration"]
    }
];

async function seedDatabase() {
    try {
        // Clear existing tools
        const { error: deleteError } = await supabase
            .from('tools')
            .delete()
            .neq('id', 0);  // Delete all records

        if (deleteError) throw deleteError;

        // Insert new tools
        const { error: insertError } = await supabase
            .from('tools')
            .insert(tools);

        if (insertError) throw insertError;

        console.log('Database seeded successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding database:', error);
        process.exit(1);
    }
}

// Run the seeder
seedDatabase();
