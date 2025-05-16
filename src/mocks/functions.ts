import * as centers from './centers.json';
import * as procedures from './procedures.json';
import * as estimations from './estimations.json';

export interface Center {
  id: string;
  name: string;
  city: string;
  address: string;
  phone: string;
  services: string[];
  openingHours: {
    [key: string]: string;
  };
}

export interface Procedure {
  id: string;
  name: string;
  steps: {
    id: string;
    name: string;
    description: string;
    estimatedTime: string;
    requiredDocuments: string[];
  }[];
}

interface Estimation {
  documentType: string;
  cost: number;
  processingTime: {
    min: string;
    max: string;
  };
  validity: string;
  requirements: {
    age: string;
    nationality: string;
  };
}

const centersData = centers as { centers: Center[] };
const proceduresData = procedures as { procedures: Procedure[] };
const estimationsData = estimations as { estimations: Estimation[] };

/**
 * Retourne les centres disponibles pour un type de document dans une ville donnée
 * @param documentType Type de document recherché
 * @param city Ville où chercher les centres
 * @returns Liste des centres correspondants
 */
export function getCentersByDocumentAndCity(
  documentType: string,
  city: string,
): Center[] {
  return centersData.centers.filter(
    (center) =>
      center.city.toLowerCase() === city.toLowerCase() &&
      center.services.includes(documentType),
  );
}

/**
 * Retourne la procédure complète pour un type de document
 * @param documentType Type de document recherché
 * @returns Procédure correspondante ou undefined si non trouvée
 */
export function getProcedureByDocument(
  documentType: string,
): Procedure | undefined {
  return proceduresData.procedures.find(
    (procedure) => procedure.name.toLowerCase() === documentType.toLowerCase(),
  );
}

/**
 * Retourne l'estimation pour un type de document
 * @param documentType Type de document recherché
 * @returns Estimation correspondante ou undefined si non trouvée
 */
export function getEstimationByDocument(
  documentType: string,
): Estimation | undefined {
  return estimationsData.estimations.find(
    (estimation) =>
      estimation.documentType.toLowerCase() === documentType.toLowerCase(),
  );
}

export function getAvailableDocumentTypes(): string[] {
  return procedures.procedures.map((p) => p.name);
}
