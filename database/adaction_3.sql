CREATE TABLE "associations" (
  "id" BIGSERIAL,
  "name" text,
  PRIMARY KEY ("id")
);

CREATE TABLE "benevoles" (
  "id" BIGSERIAL,
  "login" text NOT NULL,
  "password" text NOT NULL,
  "first_name" text NOT NULL,
  "last_name" text,
  "points_collectes" integer,
  "association_id" integer,
  "id_ville" integer NOT NULL,
  "date_creation" timestamp,
  "date_modification" timestamp,
    PRIMARY KEY ("id")
);

CREATE TABLE "collectes" (
  "id" BIGSERIAL,
  "benevole_responsable" integer NOT NULL,
  "id_association" integer,
  "id_ville" integer,
  "date" timestamp,
    PRIMARY KEY ("id")
);

CREATE TABLE "dechets" (
  "id" BIGSERIAL,
  "name" text,
  "score" integer,
    PRIMARY KEY ("id")
);

CREATE TABLE "dechets_collectes" (
  "id_collecte" integer NOT NULL,
  "id_benevole" integer NOT NULL,
  "dechet_id" integer NOT NULL,
  "dechet_quantite" integer
);

CREATE TABLE "ville" (
  "id" BIGSERIAL,
  "name" text NOT NULL,
    PRIMARY KEY ("id")
);

ALTER TABLE "benevoles" ADD CONSTRAINT "association_benevoles_id" FOREIGN KEY ("association_id") REFERENCES "associations" ("id");

ALTER TABLE "benevoles" ADD CONSTRAINT "id__benevoles_ville" FOREIGN KEY ("id_ville") REFERENCES "ville" ("id");

ALTER TABLE "collectes" ADD CONSTRAINT "id_collecte_ville" FOREIGN KEY ("id_ville") REFERENCES "ville" ("id");

ALTER TABLE "collectes" ADD CONSTRAINT "benevole_collectes_responsable" FOREIGN KEY ("benevole_responsable") REFERENCES "benevoles" ("id");

ALTER TABLE "collectes" ADD CONSTRAINT "id_collectes_association" FOREIGN KEY ("id_association") REFERENCES "associations" ("id");

ALTER TABLE "dechets_collectes" ADD CONSTRAINT "benevole_dechets_collectes_responsable" FOREIGN KEY ("id_benevole") REFERENCES "benevoles" ("id");

ALTER TABLE "dechets_collectes" ADD CONSTRAINT "id_dechets_collectes_collecte" FOREIGN KEY ("id_collecte") REFERENCES "collectes" ("id");

ALTER TABLE "dechets_collectes" ADD CONSTRAINT "id_dechets_collectes_dechet" FOREIGN KEY ("dechet_id") REFERENCES "dechets" ("id");


INSERT INTO ville (name)
VALUES
  ('Paris'), ('Amiens'), ('Rouen'), ('Reims'), ('Caen'),
  ('Brest'), ('Rennes'), ('Le Mans'), ('Orléans'), ('Tours'), 
  ('Nantes'), ('Metz'), ('Nancy'), ('Strasbourg'), ('Mulhouse'), 
  ('Dijon'), ('Besançon'), ('Limoges'), ('Clermont-Ferrand'), ('Saint-Étienne'), 
  ('Lyon'), ('Villeurbanne'), ('Annecy'), ('Bordeaux'), ('Toulouse'), 
  ('Montpellier'), ('Nîmes'), ('Aix-en-Provence'), ('Marseille'), ('Toulon'), 
  ('Nice'), ('Perpignan'), ('Grenoble'), ('Argenteuil'), ('Saint-Denis'), 
  ('Boulogne-Billancourt'), ('Montreuil');


INSERT INTO dechets (name, score)
VALUES
('Mégot de cigarette', 10), ('Emballage plastique', 30),
('Bouteille de verre', 20), ('Article de pêche', 15),
('Déchet métallique', 15);

ALTER TABLE "associations"
ADD sigle text;

ALTER TABLE "benevoles"
RENAME COLUMN login TO username;

ALTER TABLE "dechets"
ADD icon TEXT; 

ALTER TABLE dechets_collectes
  ALTER COLUMN dechet_id DROP NOT NULL;

-- creation d'un benevole random pour test

-- INSERT INTO benevoles (username, password, first_name, last_name, points_collectes, association_id, id_ville, date_creation)
-- VALUES ('supermarc74', 'lepetitchienkiko', 'Marc', 'Smith', 200, 1, 1, current_timestamp);

-- SELECT * from benevoles
-- join ville on benevoles.id_ville = ville.id
-- join associations on association_id = associations.id

ALTER TABLE associations ADD COLUMN date_creation timestamp;
ALTER TABLE associations ADD COLUMN username TEXT, ADD COLUMN password TEXT;
