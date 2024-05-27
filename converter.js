import fs from "fs";
import path from "path";
import yaml from "js-yaml";

const convertComposeToYacht = (composeFile) => {
  try {
    const composeContent = fs.readFileSync(composeFile, "utf8");
    const composeData = yaml.load(composeContent);
    const templates = [];

    Object.entries(composeData.services).forEach(
      ([serviceName, serviceData]) => {
        const labels = serviceData.labels || {};
        console.log(labels);
        const yachtService = {
          type: 1,
          title: serviceName,
          name: serviceName,
          description: labels.description || "",
          logo: labels.logo || "",
          categories: labels.categories || [],
          platform: labels.platform || "",
          image: serviceData.image,
          restart_policy: "unless-stopped",
          ports: (serviceData.ports || []).map((port) => {
            const [host, container] = port.split(":").map(Number);
            return `${host}:${container}/tcp`;
          }),
          volumes: (serviceData.volumes || []).map((volume) => {
            const [host, container] = volume.split(":");
            return { container, bind: host };
          }),
          env: (serviceData.environment || []).map((envObj) => {
            const [key, value] = envObj.split("=");
            return { name: key, label: key, default: value };
          }),
        };
        templates.push(yachtService);
      },
    );

    return templates;
  } catch (e) {
    console.error(`Error converting file ${composeFile}: ${e.message}`);
    return null;
  }
};

const processDirectory = (dir, outputFile) => {
  fs.readdir(dir, (err, files) => {
    if (err) {
      console.error(`Error reading directory ${dir}: ${err.message}`);
      return;
    }

    const yachtTemplate = {
      version: "1.0",
      templates: [],
    };

    files.forEach((file) => {
      const composeFile = path.join(dir, file);
      if (
        path.extname(composeFile) === ".yml" ||
        path.extname(composeFile) === ".yaml"
      ) {
        const templates = convertComposeToYacht(composeFile);
        if (templates) {
          yachtTemplate.templates.push(...templates);
        }
      }
    });

    fs.writeFileSync(outputFile, JSON.stringify(yachtTemplate, null, 2));
    console.log(
      `Converted all Docker Compose files in ${dir} to ${outputFile} successfully.`,
    );
  });
};

// Usage example
const composeDir = "./docker-compose";
const outputFile = "./yacht-template.json";
processDirectory(composeDir, outputFile);
