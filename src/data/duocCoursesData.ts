export interface DuocSyncCourse {
  code: string;
  name: string;
  description: string;
  semester: string;
  sections: string[];
  students: Array<{ identifier: string; name: string; section?: string }>;
  evaluaciones: Array<{ titulo: string; tipo: 'prueba' | 'trabajo' | 'informe'; fecha: number; puntos?: number; descripcion?: string }>;
}

export const DUOC_OFFICIAL_COURSES_2026_2: DuocSyncCourse[] = [
  {
    "code": "EAI4122",
    "name": "MANTENIMIENTO DE INSTALACIONES ELÉCTRICAS Y AUTOMÁTICAS",
    "description": "Sincronizado desde Vivo Duoc / AVA (Blackboard)",
    "semester": "2026-2",
    "sections": [
      "008D",
      "019D",
      "020D"
    ],
    "students": [
      {
        "identifier": "20931701-K",
        "name": "ARELLANO SAAVEDRA RENATO ANTONIO",
        "section": "008D"
      },
      {
        "identifier": "22326257-0",
        "name": "BAEZA CARRENO ALONSO HERNAN",
        "section": "008D"
      },
      {
        "identifier": "22323020-2",
        "name": "BIRR HURTADO MICHAEL ANDRE",
        "section": "008D"
      },
      {
        "identifier": "21081990-8",
        "name": "CAMPOS TORREJON MELANIE ANDREA",
        "section": "008D"
      },
      {
        "identifier": "22431176-1",
        "name": "DONOSO DUARTE LUCAS ALEJANDRO",
        "section": "008D"
      },
      {
        "identifier": "20969478-6",
        "name": "ELMES ACUNA JAMMED RICARDO",
        "section": "008D"
      },
      {
        "identifier": "21637986-1",
        "name": "FAUNDEZ PEDREROS FELIPE IGNACIO",
        "section": "008D"
      },
      {
        "identifier": "21941005-0",
        "name": "MAUREIRA QUIROZ VICENTE NICOLAS",
        "section": "008D"
      },
      {
        "identifier": "22139039-3",
        "name": "MENESES MACHUCA DIEGO EMILIO",
        "section": "008D"
      },
      {
        "identifier": "22194344-9",
        "name": "MUNOZ VILLABLANCA JORGE AGUSTIN",
        "section": "008D"
      },
      {
        "identifier": "22234243-0",
        "name": "NAVARRO MONTECINOS EMILIO FERNANDO",
        "section": "008D"
      },
      {
        "identifier": "21661415-1",
        "name": "OLEA GONZALEZ VALENTINA IGNACIA",
        "section": "008D"
      },
      {
        "identifier": "22363331-5",
        "name": "RAMOS TOBAR JOAQUIN ISRAEL",
        "section": "008D"
      },
      {
        "identifier": "22134858-3",
        "name": "ROJAS MARTINEZ JAVIER ANDRES",
        "section": "008D"
      },
      {
        "identifier": "21806607-0",
        "name": "SERRANO VEGA GABRIEL ANDRES",
        "section": "008D"
      },
      {
        "identifier": "19777930-6",
        "name": "TORRES ALVAREZ DONOVAN JESUS",
        "section": "008D"
      },
      {
        "identifier": "21744407-1",
        "name": "TRONCOSO VERDUGO IGNACIA MONSERRAT",
        "section": "008D"
      },
      {
        "identifier": "22348214-7",
        "name": "UGALDE OLIVERA JOSE GABRIEL",
        "section": "008D"
      },
      {
        "identifier": "24862290-3",
        "name": "VALLEJO GALLEGO BRIAN ESTIVEN",
        "section": "008D"
      },
      {
        "identifier": "21830479-6",
        "name": "ZAVALA CASTILLO PIERRE ALEXANDER",
        "section": "008D"
      },
      {
        "identifier": "22254590-0",
        "name": "BRAVO MALDONADO BENJAMIN ALONSO",
        "section": "019D"
      },
      {
        "identifier": "22077558-5",
        "name": "CRUZ BRAVO DIEGO PABLO",
        "section": "019D"
      },
      {
        "identifier": "22290709-8",
        "name": "DIAZ ALVARADO JESUS ANTONIO",
        "section": "019D"
      },
      {
        "identifier": "21916327-4",
        "name": "ESPINOZA IBANEZ MATIAS ESTEBAN",
        "section": "019D"
      },
      {
        "identifier": "22314563-9",
        "name": "GAHONA AMADO MARTIN EMILIO",
        "section": "019D"
      },
      {
        "identifier": "22321509-2",
        "name": "GUTIERREZ LAGOS MAXIMILIANO",
        "section": "019D"
      },
      {
        "identifier": "20990425-K",
        "name": "HUAIQUIO NUNEZ JOSE GABRIEL",
        "section": "019D"
      },
      {
        "identifier": "22240005-8",
        "name": "JARA PALMA BENJAMIN FELIPE",
        "section": "019D"
      },
      {
        "identifier": "21769115-K",
        "name": "MANCILLA MELLA MATHIAS EMERSON",
        "section": "019D"
      },
      {
        "identifier": "22212148-5",
        "name": "OJEDA BARRIGA JUAN PABLO",
        "section": "019D"
      },
      {
        "identifier": "22395375-1",
        "name": "OLIVARES ROJAS MATIAS NICOLAS ENRIQUE",
        "section": "019D"
      },
      {
        "identifier": "21546925-5",
        "name": "OSORIO RIQUELME HUGO ARMANDO",
        "section": "019D"
      },
      {
        "identifier": "22173797-0",
        "name": "RODRIGUEZ ROJAS ALONSO EDUARDO",
        "section": "019D"
      },
      {
        "identifier": "21854706-0",
        "name": "SANTIBANEZ ACEVEDO NICOLAS ANDRES",
        "section": "019D"
      },
      {
        "identifier": "22199855-3",
        "name": "SEPULVEDA MARTINEZ AARON PEDRO",
        "section": "019D"
      },
      {
        "identifier": "21755436-5",
        "name": "TORRES DIAZ SEBASTIAN",
        "section": "019D"
      },
      {
        "identifier": "22265247-2",
        "name": "TRONCOSO GONZALEZ JOSIAS JOSUE",
        "section": "019D"
      },
      {
        "identifier": "22402032-5",
        "name": "URRA COFRE SEBASTIAN IGNACIO",
        "section": "019D"
      },
      {
        "identifier": "19709272-6",
        "name": "URRUTIA MATAMALA NICOLAS",
        "section": "019D"
      },
      {
        "identifier": "22312359-7",
        "name": "URZUA MIRANDA CHRISTIAN VICENTE",
        "section": "019D"
      },
      {
        "identifier": "22136655-7",
        "name": "ALARCON ESPINOZA DIEGO ALEXIS",
        "section": "020D"
      },
      {
        "identifier": "22071061-0",
        "name": "ARELLANO PELLEGRINI ALEXIS ALONSO",
        "section": "020D"
      },
      {
        "identifier": "21307641-8",
        "name": "CATALDO RIQUELME BASTIAN",
        "section": "020D"
      },
      {
        "identifier": "22288845-K",
        "name": "CORDOVA RUBIO BRUNO",
        "section": "020D"
      },
      {
        "identifier": "21863361-7",
        "name": "DONOSO NOVA LUIS FELIPE",
        "section": "020D"
      },
      {
        "identifier": "19882438-0",
        "name": "DROGUETT VARGAS JORDAN NICOLAS",
        "section": "020D"
      },
      {
        "identifier": "21553670-K",
        "name": "FLORES FIGUEROA BENJAMIN ALONSO",
        "section": "020D"
      },
      {
        "identifier": "21408461-9",
        "name": "FRIAS GARCIA ADRIEL ALEJANDRO",
        "section": "020D"
      },
      {
        "identifier": "21930067-0",
        "name": "GUZMAN CHAVEZ JEREMIAS AMARO",
        "section": "020D"
      },
      {
        "identifier": "22252969-7",
        "name": "MARTINEZ CORNEJO MIGUEL ANGEL",
        "section": "020D"
      },
      {
        "identifier": "15350981-6",
        "name": "MENA FLORES LEONARDO DAVID",
        "section": "020D"
      },
      {
        "identifier": "20110763-6",
        "name": "OJEDA AGUILERA LUCAS ALEJANDRO",
        "section": "020D"
      },
      {
        "identifier": "21116755-6",
        "name": "ORELLANA MONCADA MICHELE ALEJANDRA",
        "section": "020D"
      },
      {
        "identifier": "20119213-7",
        "name": "PEREZ SALAZAR ALONSO IGNACIO",
        "section": "020D"
      },
      {
        "identifier": "20858963-6",
        "name": "PIZARRO TORRES CRISTIAN",
        "section": "020D"
      },
      {
        "identifier": "22306039-0",
        "name": "ROJAS DELGADO BENJAMIN BALTAZAR ROBERTO",
        "section": "020D"
      },
      {
        "identifier": "12814172-3",
        "name": "RONDA LOPEZ ERIKA MAGDALENA",
        "section": "020D"
      },
      {
        "identifier": "20605567-7",
        "name": "SAUNDERS GONZALEZ HARRIET LILY MARIA",
        "section": "020D"
      },
      {
        "identifier": "22132005-0",
        "name": "SILVA RIVERA CRISTOBAL IGNACIO",
        "section": "020D"
      },
      {
        "identifier": "20761461-0",
        "name": "VELASTIN LEIVA NICOLAS MAURICIO",
        "section": "020D"
      }
    ],
    "evaluaciones": [
      {
        "titulo": "Evaluación Parcial 1 (EA1)",
        "tipo": "prueba",
        "fecha": 1790697920424,
        "puntos": 100,
        "descripcion": "Evaluación teórica y conceptual de la Experiencia de Aprendizaje 1"
      },
      {
        "titulo": "Taller Práctico / Caso Real (EA2)",
        "tipo": "trabajo",
        "fecha": 1791907520424,
        "puntos": 150,
        "descripcion": "Desarrollo y aplicación práctica de competencias en laboratorio"
      },
      {
        "titulo": "Examen Transversal / Cierre (EA3)",
        "tipo": "informe",
        "fecha": 1793981120424,
        "puntos": 200,
        "descripcion": "Entrega final y defensa de proyecto integrador"
      }
    ]
  },
  {
    "code": "GDP4475",
    "name": "GESTIÓN DE PROYECTOS II",
    "description": "Sincronizado desde Vivo Duoc / AVA (Blackboard)",
    "semester": "2026-2",
    "sections": [
      "002D",
      "006V"
    ],
    "students": [
      {
        "identifier": "21715729-3",
        "name": "ARELLANO DE LA BARRERA CAROLINA LESLIE",
        "section": "002D"
      },
      {
        "identifier": "21509697-1",
        "name": "BELLO CARRASCO YULIANNO ALEXANDRE",
        "section": "002D"
      },
      {
        "identifier": "20205919-8",
        "name": "CANDIA CARVAJAL GONZALO ALEJANDRO",
        "section": "002D"
      },
      {
        "identifier": "21468773-9",
        "name": "CIFUENTES ULLOA MATIAS",
        "section": "002D"
      },
      {
        "identifier": "17307081-0",
        "name": "CORVALAN TRANAMIL CAMILO ANDRES",
        "section": "002D"
      },
      {
        "identifier": "21646534-2",
        "name": "CURAMIL QUINTOMAN JORGE ANDRES",
        "section": "002D"
      },
      {
        "identifier": "20051205-7",
        "name": "DIAZ LANDEROS DANIEL ALEJANDRO",
        "section": "002D"
      },
      {
        "identifier": "22216275-0",
        "name": "ESPINOZA MARIN ANITA BELEN",
        "section": "002D"
      },
      {
        "identifier": "21449730-1",
        "name": "FIGUEROA LLANCA CRISTIAN JONATHAN",
        "section": "002D"
      },
      {
        "identifier": "22978687-3",
        "name": "FIGUEROA TORRES CRISTHOFER ANGEL",
        "section": "002D"
      },
      {
        "identifier": "20576927-7",
        "name": "GUERRERO LOPEZ JEREMY ISAIC",
        "section": "002D"
      },
      {
        "identifier": "21931967-3",
        "name": "GUTIERREZ ROJAS IGNACIO ESTEBAN",
        "section": "002D"
      },
      {
        "identifier": "91000599-5",
        "name": "LESMES CABANZO JHOJAN DANIEL",
        "section": "002D"
      },
      {
        "identifier": "22000480-5",
        "name": "MARQUEZ ROJAS SOFIA CATALINA",
        "section": "002D"
      },
      {
        "identifier": "22054533-4",
        "name": "MARTINEZ MARTINEZ ANTONIA CAMILA",
        "section": "002D"
      },
      {
        "identifier": "21845312-0",
        "name": "MATAMOROS PANES FELIPE MAURICIO ALEJANDRO ARTURO",
        "section": "002D"
      },
      {
        "identifier": "21025316-5",
        "name": "MEDINA LEIVA LAURA LORENA",
        "section": "002D"
      },
      {
        "identifier": "21864756-1",
        "name": "MONDACA OBREQUE CRISTOBAL FERNANDO",
        "section": "002D"
      },
      {
        "identifier": "19882102-0",
        "name": "MONTES PERINEZ DENIS GISSEL PALOMA",
        "section": "002D"
      },
      {
        "identifier": "21535209-9",
        "name": "MUNOZ MUNOZ FELIPE",
        "section": "002D"
      },
      {
        "identifier": "19833375-1",
        "name": "OLIVOS ALLENDES EXEQUIEL",
        "section": "002D"
      },
      {
        "identifier": "22087425-7",
        "name": "OSSES BUGUENO MAXIMILIANO RAFAEL",
        "section": "002D"
      },
      {
        "identifier": "21974008-5",
        "name": "PARADA BARRAZA VICENTE TOMAS",
        "section": "002D"
      },
      {
        "identifier": "20723145-2",
        "name": "QUINONES QUINONES CRISTIAN",
        "section": "002D"
      },
      {
        "identifier": "20872002-3",
        "name": "REYES CASTRO FRANCISCO AARON",
        "section": "002D"
      },
      {
        "identifier": "26173024-3",
        "name": "RODRIGUEZ SANTOS GABRIEL MOISES",
        "section": "002D"
      },
      {
        "identifier": "21127616-9",
        "name": "RUZ ANCHIL DIEGO ABRAHAM",
        "section": "002D"
      },
      {
        "identifier": "21344266-K",
        "name": "SAN MARTIN SANCHEZ OSCAR GABRIEL",
        "section": "002D"
      },
      {
        "identifier": "22027576-0",
        "name": "ZAMBRANO MELLADO JUAN CARLOS",
        "section": "002D"
      },
      {
        "identifier": "19208057-6",
        "name": "ACEITUNO TIRAPEGUI CRISTIAN FELIPE",
        "section": "006V"
      },
      {
        "identifier": "25480571-8",
        "name": "ALANDETE CARCAMO FREDDY JOSE",
        "section": "006V"
      },
      {
        "identifier": "20998400-8",
        "name": "ARIAS ARRIAGADA BRANDON ANTONIO",
        "section": "006V"
      },
      {
        "identifier": "19497767-0",
        "name": "BASTIAS MANQUIAN ERICK ANDRES",
        "section": "006V"
      },
      {
        "identifier": "15538666-5",
        "name": "BEJAR ZAMORANO MARCO ANTONIO",
        "section": "006V"
      },
      {
        "identifier": "17664109-6",
        "name": "BUNSTER SALDANA YURI JAVIER",
        "section": "006V"
      },
      {
        "identifier": "22017724-6",
        "name": "CHANDIA ANTINAO OMAR ALEJANDRO",
        "section": "006V"
      },
      {
        "identifier": "21456804-7",
        "name": "CID GODOY MAYCOL ALEJANDRO",
        "section": "006V"
      },
      {
        "identifier": "17189845-5",
        "name": "CONTRERAS ESPINOZA FERNANDO ALVARO ANDRES",
        "section": "006V"
      },
      {
        "identifier": "13555062-0",
        "name": "CRISOSTOMO CUEVAS MIGUEL PATRICIO",
        "section": "006V"
      },
      {
        "identifier": "21721119-0",
        "name": "DONOSO CACERES DANIEL IGNACIO",
        "section": "006V"
      },
      {
        "identifier": "18456846-2",
        "name": "FUENTEALBA MACHUCA JONATHAN ANDRES",
        "section": "006V"
      },
      {
        "identifier": "21829311-5",
        "name": "GONZALEZ FIEDLER BENJAMIN IGNACIO",
        "section": "006V"
      },
      {
        "identifier": "14609964-5",
        "name": "GONZALEZ REVECO CHRISTIAN ELIAS",
        "section": "006V"
      },
      {
        "identifier": "21931471-K",
        "name": "JORQUERA CARQUIN PIERRE ISMAEL JESUS",
        "section": "006V"
      },
      {
        "identifier": "20220147-4",
        "name": "LOYOLA SANCHEZ ANGEL",
        "section": "006V"
      },
      {
        "identifier": "20995511-3",
        "name": "MARGUE NUNEZ CRISTOPHER JESUS",
        "section": "006V"
      },
      {
        "identifier": "26250305-4",
        "name": "MICHEL MICHEL BENCHEELOVE",
        "section": "006V"
      },
      {
        "identifier": "20246175-1",
        "name": "MONTANARES NAVARRETE CARLOS PATRICIO ANDRES",
        "section": "006V"
      },
      {
        "identifier": "20381812-2",
        "name": "MORA SANCHEZ VICTOR MANUEL",
        "section": "006V"
      },
      {
        "identifier": "24892507-8",
        "name": "MORENO ROBLES CESAR ABRAHAN",
        "section": "006V"
      },
      {
        "identifier": "21381657-8",
        "name": "MUNIZ SEVERINO DIEGO ALEJANDRO",
        "section": "006V"
      },
      {
        "identifier": "19385509-1",
        "name": "NAVARRETE CAAMANO SEBASTIAN",
        "section": "006V"
      },
      {
        "identifier": "20556782-8",
        "name": "OLIVARES JAURE PABLO",
        "section": "006V"
      },
      {
        "identifier": "19745133-5",
        "name": "ORELLANA CARTES FRANCISCA JAVIERA",
        "section": "006V"
      },
      {
        "identifier": "18278486-9",
        "name": "REYES ALBORNOZ JEAN CARLOS",
        "section": "006V"
      },
      {
        "identifier": "17612854-2",
        "name": "RIVERA FLANDEZ FRANCISCO JAVIER",
        "section": "006V"
      },
      {
        "identifier": "21706678-6",
        "name": "ROMAN ORDONEZ CRISTOBAL IGNACIO",
        "section": "006V"
      },
      {
        "identifier": "19563465-3",
        "name": "SANTANA LONCOMILLA MANUEL IGNACIO",
        "section": "006V"
      },
      {
        "identifier": "20222565-9",
        "name": "VASQUEZ ORELLANA BASTIAN MATIAS",
        "section": "006V"
      },
      {
        "identifier": "20576983-8",
        "name": "ZAVALA FELIX JOHANS GEREMY",
        "section": "006V"
      }
    ],
    "evaluaciones": [
      {
        "titulo": "Evaluación Parcial 1 (EA1)",
        "tipo": "prueba",
        "fecha": 1790697920424,
        "puntos": 100,
        "descripcion": "Evaluación teórica y conceptual de la Experiencia de Aprendizaje 1"
      },
      {
        "titulo": "Taller Práctico / Caso Real (EA2)",
        "tipo": "trabajo",
        "fecha": 1791907520424,
        "puntos": 150,
        "descripcion": "Desarrollo y aplicación práctica de competencias en laboratorio"
      },
      {
        "titulo": "Examen Transversal / Cierre (EA3)",
        "tipo": "informe",
        "fecha": 1793981120424,
        "puntos": 200,
        "descripcion": "Entrega final y defensa de proyecto integrador"
      }
    ]
  },
  {
    "code": "PEI1110",
    "name": "INSTALACIONES ELÉCTRICAS / ILUMINACIÓN",
    "description": "Sincronizado desde Vivo Duoc / AVA (Blackboard)",
    "semester": "2026-2",
    "sections": [
      "003D",
      "004D",
      "011D",
      "012D"
    ],
    "students": [
      {
        "identifier": "22446679-K",
        "name": "ARAYA CORDOVA MARTIN ANTONIO",
        "section": "003D"
      },
      {
        "identifier": "22581043-5",
        "name": "BARRA ARAGON PIA ALEJANDRA",
        "section": "003D"
      },
      {
        "identifier": "22513174-0",
        "name": "BRAVO FLORES DILAN MARTIN JESUS",
        "section": "003D"
      },
      {
        "identifier": "21994703-8",
        "name": "BURGOS GONZALEZ ENRIQUE",
        "section": "003D"
      },
      {
        "identifier": "21977373-0",
        "name": "CARIMAN SERON GIOVANNI ALEXIS",
        "section": "003D"
      },
      {
        "identifier": "22527954-3",
        "name": "CASTRO ESPINOZA FERNANDO ANDRES",
        "section": "003D"
      },
      {
        "identifier": "22479906-3",
        "name": "CUEVAS SEPULVEDA JUAN CARLOS",
        "section": "003D"
      },
      {
        "identifier": "22247608-9",
        "name": "FLORES GUERRA JASON DANIEL",
        "section": "003D"
      },
      {
        "identifier": "22032117-7",
        "name": "GALEANO ALLENDE YVOTY ANASTASIA",
        "section": "003D"
      },
      {
        "identifier": "22600551-K",
        "name": "GODOY HERRERA MATIAS NICOLAS",
        "section": "003D"
      },
      {
        "identifier": "22507217-5",
        "name": "GONZALEZ ANCALIPE RENATA TAMARA ANTONIA",
        "section": "003D"
      },
      {
        "identifier": "21560376-8",
        "name": "GONZALEZ VARGAS LUKAS ABEL",
        "section": "003D"
      },
      {
        "identifier": "20642991-7",
        "name": "GREZ ACUNA CATALINA FERNANDA",
        "section": "003D"
      },
      {
        "identifier": "21634990-3",
        "name": "LLANTEN HURTADO BENJAMIN ELIAS",
        "section": "003D"
      },
      {
        "identifier": "22704899-9",
        "name": "MESSINA REYES MARTINA IGNACIA",
        "section": "003D"
      },
      {
        "identifier": "22554505-7",
        "name": "MONTECINOS HERNANDEZ LUCAS HERNAN BENJAMIN",
        "section": "003D"
      },
      {
        "identifier": "21231175-8",
        "name": "ORDONEZ ORMENO IVAN ALEJANDRO",
        "section": "003D"
      },
      {
        "identifier": "22423012-5",
        "name": "PALOMINOS VALVERDE MATIAS ANDRES",
        "section": "003D"
      },
      {
        "identifier": "22218046-5",
        "name": "RAMIREZ LORCA BENJAMIN ALEXIS",
        "section": "003D"
      },
      {
        "identifier": "22280575-9",
        "name": "SILVA MANSILLA AMARO JAVIER",
        "section": "003D"
      },
      {
        "identifier": "22723960-3",
        "name": "ALFARO PEREZ JOAQUIN ESTEBAN",
        "section": "004D"
      },
      {
        "identifier": "20825760-9",
        "name": "BERNAL BERNAL ANGELO ALEJANDRO",
        "section": "004D"
      },
      {
        "identifier": "22648790-5",
        "name": "CORNEJO ALUN BENJAMIN ALEXIS",
        "section": "004D"
      },
      {
        "identifier": "21117037-9",
        "name": "GARCIA ALARCON BASTIAN IGNACIO",
        "section": "004D"
      },
      {
        "identifier": "20949441-8",
        "name": "JARAMILLO VERGARA FRANCO ISMAEL",
        "section": "004D"
      },
      {
        "identifier": "22416747-4",
        "name": "LUENGO CESPED VICENTE IGNACIO",
        "section": "004D"
      },
      {
        "identifier": "22451086-1",
        "name": "MORALES BAEZ ISIDORA ALEJANDRA",
        "section": "004D"
      },
      {
        "identifier": "22576914-1",
        "name": "MORALES BAHAMONDES ARIELA IGNACIA",
        "section": "004D"
      },
      {
        "identifier": "22642983-2",
        "name": "PENA RIVEROS YERAL ANTONIO",
        "section": "004D"
      },
      {
        "identifier": "22667884-0",
        "name": "RAMIREZ NATALI MATIAS ALEJANDRO",
        "section": "004D"
      },
      {
        "identifier": "27131772-7",
        "name": "ROJAS HERRERA NATHALIA SOFIA",
        "section": "004D"
      },
      {
        "identifier": "22167452-9",
        "name": "SALFATE PAVEZ LUCAS GABRIEL",
        "section": "004D"
      },
      {
        "identifier": "22623852-2",
        "name": "SANDOVAL MORALES SEBASTIAN IGNACIO",
        "section": "004D"
      },
      {
        "identifier": "22469845-3",
        "name": "TRANGO VENEGAS JUAN ESTEBAN",
        "section": "004D"
      },
      {
        "identifier": "22637085-4",
        "name": "VARGAS CID FRANCISCO JAVIER",
        "section": "004D"
      },
      {
        "identifier": "22250102-4",
        "name": "ALARCON VILLABLANCA GUSTAVO ADOLFO",
        "section": "011D"
      },
      {
        "identifier": "22669640-7",
        "name": "ALVAREZ SEGURA ALONSO PATRICIO",
        "section": "011D"
      },
      {
        "identifier": "22687525-5",
        "name": "ARCE ESCUDERO PRICILA JAZMIN",
        "section": "011D"
      },
      {
        "identifier": "22226995-4",
        "name": "BECERRA CERON SEBASTIAN ANDRES",
        "section": "011D"
      },
      {
        "identifier": "20212518-2",
        "name": "BURGOS ORELLANA BENJAMIN IGNACIO",
        "section": "011D"
      },
      {
        "identifier": "22252707-4",
        "name": "BUSTAMANTE ALVAREZ FABIAN ANTONIO",
        "section": "011D"
      },
      {
        "identifier": "22435648-K",
        "name": "CALFICOY NUNEZ MARTIN TOMAS",
        "section": "011D"
      },
      {
        "identifier": "21842299-3",
        "name": "HENRIQUEZ LOPEZ FERNANDO JESUS",
        "section": "011D"
      },
      {
        "identifier": "22539126-2",
        "name": "HERNANDEZ MONROY FABIO ENRIQUE",
        "section": "011D"
      },
      {
        "identifier": "20961417-0",
        "name": "MUNOZ CANDIA JOAQUIN ALEXIS",
        "section": "011D"
      },
      {
        "identifier": "18730863-1",
        "name": "PENA ULLOA IGNACIO MANUEL",
        "section": "011D"
      },
      {
        "identifier": "22596833-0",
        "name": "PILQUIMAN VARGAS NICOLAS IGNACIO",
        "section": "011D"
      },
      {
        "identifier": "21605551-9",
        "name": "RAMIREZ RAMIREZ CARLOS",
        "section": "011D"
      },
      {
        "identifier": "21952497-8",
        "name": "RODRIGUEZ RIQUELME RODRIGO",
        "section": "011D"
      },
      {
        "identifier": "20435386-7",
        "name": "SEGURA CEBALLO CARLOS ALFONSO",
        "section": "011D"
      },
      {
        "identifier": "13920421-2",
        "name": "VEJAR SALAZAR DEIVIS GABRIEL",
        "section": "011D"
      },
      {
        "identifier": "22387513-0",
        "name": "BARRA BRICENO JOSEFINA PILAR",
        "section": "012D"
      },
      {
        "identifier": "22644311-8",
        "name": "CASTRO SPANGUEL FELIPE ANDRES",
        "section": "012D"
      },
      {
        "identifier": "27850478-6",
        "name": "FERRER FERRER GUILLERMO ENRIQUE",
        "section": "012D"
      },
      {
        "identifier": "22445525-9",
        "name": "GONZALEZ MUNOZ MATIAS ALEJANDRO",
        "section": "012D"
      },
      {
        "identifier": "22551599-9",
        "name": "HURTADO VAZQUES XAVIER",
        "section": "012D"
      },
      {
        "identifier": "22670653-4",
        "name": "IGLESIAS AGUILERA BENJAMIN IGNACIO",
        "section": "012D"
      },
      {
        "identifier": "22271731-0",
        "name": "MAUREIRA FUENTES SEBASTIAN IGNACIO",
        "section": "012D"
      },
      {
        "identifier": "27539309-6",
        "name": "MUNAYCO GARCIA EDDER JERMEIN HELEIA",
        "section": "012D"
      },
      {
        "identifier": "28238323-3",
        "name": "QUINONES FAJARDO JOSMAR ALEXANDER",
        "section": "012D"
      },
      {
        "identifier": "21822759-7",
        "name": "ROJAS MAUREIRA MATIAS EMILIO",
        "section": "012D"
      },
      {
        "identifier": "22495455-7",
        "name": "SAEZ SANCHEZ DIEGO AGUSTIN",
        "section": "012D"
      },
      {
        "identifier": "22109948-6",
        "name": "VARGAS LEIVA BENJAMIN ANDRES",
        "section": "012D"
      }
    ],
    "evaluaciones": [
      {
        "titulo": "Evaluación Parcial 1 (EA1)",
        "tipo": "prueba",
        "fecha": 1790697920425,
        "puntos": 100,
        "descripcion": "Evaluación teórica y conceptual de la Experiencia de Aprendizaje 1"
      },
      {
        "titulo": "Taller Práctico / Caso Real (EA2)",
        "tipo": "trabajo",
        "fecha": 1791907520425,
        "puntos": 150,
        "descripcion": "Desarrollo y aplicación práctica de competencias en laboratorio"
      },
      {
        "titulo": "Examen Transversal / Cierre (EA3)",
        "tipo": "informe",
        "fecha": 1793981120425,
        "puntos": 200,
        "descripcion": "Entrega final y defensa de proyecto integrador"
      }
    ]
  },
  {
    "code": "TAEX1061",
    "name": "PINTURA",
    "description": "Sincronizado desde Vivo Duoc / AVA (Blackboard)",
    "semester": "2026-2",
    "sections": [
      "01D"
    ],
    "students": [
      {
        "identifier": "20295451-0",
        "name": "FERNANDEZ PARRA BRYAN IGNACIO",
        "section": "01D"
      },
      {
        "identifier": "19841712-2",
        "name": "GAETE FERNANDEZ JOSE MANUEL",
        "section": "01D"
      },
      {
        "identifier": "20536151-0",
        "name": "MORALES CASTRO CAMILO ALEJANDRO",
        "section": "01D"
      },
      {
        "identifier": "21078732-1",
        "name": "PADILLA GONZALEZ FRANCISCA CATALINA",
        "section": "01D"
      },
      {
        "identifier": "21447516-2",
        "name": "PALACIOS SEPULVEDA MONTSERRAT BELEN",
        "section": "01D"
      },
      {
        "identifier": "21304112-6",
        "name": "ROMERO OYARCE ANTONIA ANDREA",
        "section": "01D"
      },
      {
        "identifier": "21668922-4",
        "name": "VILLALON ROMERO ANTONELLA MARTINA",
        "section": "01D"
      }
    ],
    "evaluaciones": [
      {
        "titulo": "Evaluación Parcial 1 (EA1)",
        "tipo": "prueba",
        "fecha": 1790697920425,
        "puntos": 100,
        "descripcion": "Evaluación teórica y conceptual de la Experiencia de Aprendizaje 1"
      },
      {
        "titulo": "Taller Práctico / Caso Real (EA2)",
        "tipo": "trabajo",
        "fecha": 1791907520425,
        "puntos": 150,
        "descripcion": "Desarrollo y aplicación práctica de competencias en laboratorio"
      },
      {
        "titulo": "Examen Transversal / Cierre (EA3)",
        "tipo": "informe",
        "fecha": 1793981120425,
        "puntos": 200,
        "descripcion": "Entrega final y defensa de proyecto integrador"
      }
    ]
  }
];
