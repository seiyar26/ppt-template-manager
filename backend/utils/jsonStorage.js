/**
 * Module de stockage JSON pour remplacer Sequelize/SQLite
 * Solution lu00e9gu00e8re pour les hu00e9bergements partagu00e9s sans accu00e8s u00e0 une base de donnu00e9es
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class JsonStorage {
  constructor(modelName) {
    this.modelName = modelName;
    this.dataDir = path.join(__dirname, '../data');
    this.dataFile = path.join(this.dataDir, `${modelName}.json`);
    this.initStorage();
  }

  initStorage() {
    // Cru00e9er le ru00e9pertoire de donnu00e9es s'il n'existe pas
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }

    // Cru00e9er le fichier de donnu00e9es s'il n'existe pas
    if (!fs.existsSync(this.dataFile)) {
      fs.writeFileSync(this.dataFile, JSON.stringify([]), 'utf8');
    }
  }

  async readData() {
    try {
      const data = fs.readFileSync(this.dataFile, 'utf8');
      return JSON.parse(data || '[]');
    } catch (error) {
      console.error(`Erreur lors de la lecture des donnu00e9es ${this.modelName}:`, error);
      return [];
    }
  }

  async writeData(data) {
    try {
      fs.writeFileSync(this.dataFile, JSON.stringify(data, null, 2), 'utf8');
      return true;
    } catch (error) {
      console.error(`Erreur lors de l'u00e9criture des donnu00e9es ${this.modelName}:`, error);
      return false;
    }
  }

  async findAll(options = {}) {
    const data = await this.readData();
    
    // Filtrage basique
    let result = [...data];
    
    if (options.where) {
      result = result.filter(item => {
        for (const [key, value] of Object.entries(options.where)) {
          if (item[key] !== value) {
            return false;
          }
        }
        return true;
      });
    }
    
    // Tri basique
    if (options.order) {
      const [field, direction] = options.order[0];
      result.sort((a, b) => {
        if (direction === 'ASC') {
          return a[field] > b[field] ? 1 : -1;
        } else {
          return a[field] < b[field] ? 1 : -1;
        }
      });
    }
    
    // Limite et offset
    if (options.limit) {
      const offset = options.offset || 0;
      result = result.slice(offset, offset + options.limit);
    }
    
    return result;
  }

  async findOne(options = {}) {
    const results = await this.findAll(options);
    return results.length > 0 ? results[0] : null;
  }

  async findByPk(id) {
    const data = await this.readData();
    return data.find(item => item.id === id) || null;
  }

  async create(values) {
    const data = await this.readData();
    
    // Gu00e9nu00e9rer un ID unique
    const id = values.id || crypto.randomUUID();
    
    // Ajouter les timestamps
    const now = new Date().toISOString();
    const newItem = {
      ...values,
      id,
      created_at: now,
      updated_at: now
    };
    
    data.push(newItem);
    await this.writeData(data);
    
    return newItem;
  }

  async update(values, options) {
    const data = await this.readData();
    let updated = false;
    
    const updatedData = data.map(item => {
      let shouldUpdate = false;
      
      if (options.where) {
        shouldUpdate = Object.entries(options.where).every(
          ([key, value]) => item[key] === value
        );
      } else if (options.id) {
        shouldUpdate = item.id === options.id;
      }
      
      if (shouldUpdate) {
        updated = true;
        return {
          ...item,
          ...values,
          updated_at: new Date().toISOString()
        };
      }
      
      return item;
    });
    
    if (updated) {
      await this.writeData(updatedData);
    }
    
    return [updated ? 1 : 0];
  }

  async destroy(options) {
    const data = await this.readData();
    const initialLength = data.length;
    
    let filteredData = [...data];
    
    if (options.where) {
      filteredData = data.filter(item => {
        for (const [key, value] of Object.entries(options.where)) {
          if (item[key] === value) {
            return false; // Exclure cet u00e9lu00e9ment
          }
        }
        return true; // Garder cet u00e9lu00e9ment
      });
    } else if (options.id) {
      filteredData = data.filter(item => item.id !== options.id);
    }
    
    await this.writeData(filteredData);
    
    return initialLength - filteredData.length;
  }

  // Mu00e9thode utilitaire pour ru00e9initialiser le stockage
  async sync(options = {}) {
    if (options.force) {
      await this.writeData([]);
      console.log(`Stockage ${this.modelName} ru00e9initialisu00e9`);
    }
    return { modelName: this.modelName };
  }
}

module.exports = JsonStorage;
