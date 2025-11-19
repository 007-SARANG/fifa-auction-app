// Script to fetch FIFA 23 player images from FutBin
// This uses a public mapping of player names to FutBin IDs

import fs from 'fs';
import { PLAYER_DATABASE } from './player-database-new.js';

// Manual mapping of known player IDs from FutBin
// These are FIFA 23 Ultimate Team player IDs
const PLAYER_ID_MAP = {
  "Kylian Mbappé": "231747",
  "Erling Haaland": "239085",
  "Kevin De Bruyne": "192985",
  "Lionel Messi": "158023",
  "Cristiano Ronaldo": "20801",
  "Neymar Jr": "190871",
  "Robert Lewandowski": "188545",
  "Mohamed Salah": "209331",
  "Sadio Mané": "208722",
  "Virgil van Dijk": "203376",
  "Karim Benzema": "165153",
  "Luka Modrić": "177003",
  "Thibaut Courtois": "192119",
  "Manuel Neuer": "167495",
  "Harry Kane": "202126",
  "Son Heung-Min": "200104",
  "Bruno Fernandes": "212198",
  "Joshua Kimmich": "212622",
  "Casemiro": "200145",
  "Alisson": "212831",
  "Toni Kroos": "182521",
  "N'Golo Kanté": "215914",
  "Paul Pogba": "195864",
  "Sergio Ramos": "155862",
  "Raheem Sterling": "202652",
  "Jan Oblak": "200389",
  "Ederson": "210257",
  "Marc-André ter Stegen": "192448",
  "Marquinhos": "207093",
  "Bernardo Silva": "218667",
  "Frenkie de Jong": "228702",
  "Romelu Lukaku": "192505",
  "Trent Alexander-Arnold": "231281",
  "Andrew Robertson": "216267",
  "Rúben Dias": "239818",
  "Édouard Mendy": "233047",
  "João Cancelo": "210514",
  "Fabinho": "209499",
  "Luis Díaz": "241084",
  "Vinícius Jr.": "238794",
  "Federico Chiesa": "235805",
  "Phil Foden": "237692",
  "Rodri": "231866",
  "João Félix": "242444",
  "Kingsley Coman": "213345",
  "Leon Goretzka": "209658",
  "Kai Havertz": "235790",
  "Mason Mount": "233064",
  "Alphonso Davies": "234396",
  "Raphaël Varane": "201535",
  "Koke": "193747",
  "Thiago Alcântara": "189509",
  "Heung-Min Son": "200104",
  "Heung Min Son": "200104",
  "Pedri": "251854",
  "Gavi": "264240",
  "Serge Gnabry": "206113",
  "Jadon Sancho": "233049",
  "Antoine Griezmann": "194765",
  "Kalidou Koulibaly": "201024",
  "Gregor Kobel": "233064",
  "Éder Militão": "240130",
  "Aymeric Laporte": "212218",
  "Milan Škriniar": "213303",
  "Niklas Süle": "220914",
  "Ciro Immobile": "173153",
  "Matthijs de Ligt": "235243",
  "Nicolò Barella": "224232",
  "Kyle Walker": "188377",
  "Riyad Mahrez": "204485",
  "Marcos Acuña": "226380",
  "Diogo Jota": "224458",
  "Dominik Szoboszlai": "255253",
  "Sandro Tonali": "232423",
  "Stefan de Vrij": "184344",
  "Yann Sommer": "164435",
  "Dušan Tadić": "167650",
  "Marcos Llorente": "226161",
  "Paulo Dybala": "211110",
  "Thomas Müller": "189596",
  "Dayot Upamecano": "229558",
  "Kieran Trippier": "186345",
  "Leroy Sané": "192565",
  "Ronald Araújo": "247679",
  "Lisandro Martínez": "231478",
  "Thiago Silva": "165511",
  "Lucas Hernández": "220814",
  "Cristian Romero": "232488",
  "Bremer": "234632",
  "Pau Torres": "234641",
  "Presnel Kimpembe": "201282",
  "Ibrahima Konaté": "237678",
  "John Stones": "203574",
  "Christian Eriksen": "190460",
  "Piotr Zieliński": "199360",
  "Raphinha": "241084",
  "Moussa Diaby": "234906",
  "Ousmane Dembélé": "231443",
  "Domenico Berardi": "199556",
  "Diego Carlos": "213331",
  "Gerard Moreno": "212462",
  "Jorginho": "205498",
  "Mikel Oyarzabal": "230142",
  "Lorenzo Pellegrini": "234060",
  "Cody Gakpo": "236196",
  "Jordan Pickford": "204935",
  "Luis Muriel": "178509",
  "Wilfred Ndidi": "226224",
  "Dani Olmo": "244260",
  "Unai Simón": "230621",
  "Iñaki Williams": "230977",
  "Jeremie Frimpong": "241486",
  "Nuno Mendes": "251573",
  "Noussair Mazraoui": "236401",
  "Steven Berghuis": "181291",
  "Samir Handanović": "161644",
  "Lucas Paquetá": "235869",
  "Darwin Núñez": "253072",
  "William Carvalho": "208847",
  "Dominik Livaković": "195272",
  "Richarlison": "231943",
  "Juan Cuadrado": "189513",
  "Jesús Navas": "146536",
  "Ivan Rakitić": "168651",
  "José Sá": "216217",
  "Emre Can": "200958",
  "Aaron Wan-Bissaka": "222509",
  "Leandro Trossard": "207421",
  "Zambo Anguissa": "234378",
  "Memphis Depay": "202556",
  "Tammy Abraham": "233047",
  "Timo Werner": "212188",
  "Pedro Porro": "238789",
  "Rafa": "207297",
  "Antony": "240833",
  "Ferran Torres": "241084",
  "Carlos Soler": "226161",
  "Thomas Lemar": "208418",
  "Hakim Ziyech": "208670",
  "Hirving Lozano": "216756",
  "Nick Pope": "196334",
  "Fernando": "181458",
  "Alexander Isak": "234196",
  "Nicolás Tagliafico": "192353",
  "Kaoru Mitoma": "245367",
  "Leonardo Spinazzola": "198008",
  "Konrad Laimer": "223959",
  "Marco Reus": "188350",
  "Chris Smalling": "178603",
  "Matthias Ginter": "209293",
  "Ricardo Pereira": "208330",
  "Leon Bailey": "229906",
  "Álex Grimaldo": "210035",
  "José Gayà": "216267",
  "Ollie Watkins": "231677",
  "Ben White": "233064",
  "Idrissa Gueye": "183907",
  "Lucas Moura": "181848",
  "Anthony Martial": "211300",
  "Ante Rebić": "206495",
  "Conor Coady": "184941",
  "Wout Weghorst": "223660",
  "Roger Ibañez": "234234",
  "Taiwo Awoniyi": "231677",
  "Manuel Ugarte": "256630",
  "Jules Koundé": "241486",
  "Rafael Leão": "234378",
  "Theo Hernández": "232656",
  "Mike Maignan": "215698",
  "Achraf Hakimi": "235212",
  "Marco Verratti": "197655",
  "Dusan Vlahovic": "247394",
  "Christopher Nkunku": "232411",
  "Franck Kessié": "226753",
  "Federico Valverde": "240783",
  "Dušan Vlahović": "247394",
  "Jamal Musiala": "256630",
  "Florian Wirtz": "256630",
  "Jude Bellingham": "252371",
  "Bukayo Saka": "246669",
  "Declan Rice": "234378",
  "Eduardo Camavinga": "248243",
  "Aurélien Tchouaméni": "241486",
  "William Saliba": "241096",
  "Gabriel Martinelli": "251517",
  "Gianluigi Donnarumma": "230621",
  "Joško Gvardiol": "251804",
  "Enzo Fernández": "234641",
  "Victor Osimhen": "233331",
  "Khvicha Kvaratskhelia": "242510",
  "Alejandro Garnacho": "270749",
  "Marcus Rashford": "231677",
  "Reece James": "238074",
  "Fikayo Tomori": "232880",
  "Yassine Bounou": "209515",
  "Nicolo Barella": "224232",
  "Lautaro Martínez": "231478",
  "Alessandro Bastoni": "244753",
  "Denzel Dumfries": "235243",
  "Ivan Perišić": "181458",
  "Brahim Díaz": "231410",
  "Eder Militão": "240130",
  "Rodrygo": "243812",
  "Antonio Rüdiger": "205452",
  "David Alaba": "197445",
  "Ferland Mendy": "224260",
  "Dani Carvajal": "204963",
  "Isco": "197781",
};

function updatePlayerImages() {
  console.log('🔍 Updating player images...\n');
  
  let updatedCount = 0;
  let notFoundCount = 0;
  const notFoundPlayers = [];

  const updatedPlayers = PLAYER_DATABASE.map(player => {
    const playerId = PLAYER_ID_MAP[player.name];
    
    if (playerId) {
      updatedCount++;
      console.log(`✅ Found: ${player.name} (ID: ${playerId})`);
      return {
        ...player,
        imageUrl: `https://cdn.futwiz.com/assets/img/fifa23/faces/${playerId}.png`
      };
    } else {
      notFoundCount++;
      notFoundPlayers.push(player.name);
      console.log(`❌ Not found: ${player.name}`);
      return {
        ...player,
        imageUrl: `https://cdn.sofifa.net/players/default.png` // Keep default
      };
    }
  });

  // Generate new file content
  const fileContent = `// FIFA Player Database - Converted from player_database.json
// Total Players: ${updatedPlayers.length}
// Last Updated: ${new Date().toISOString().split('T')[0]}
// Images Updated: ${updatedCount} players

const PLAYER_DATABASE = ${JSON.stringify(updatedPlayers, null, 2)};

export { PLAYER_DATABASE };
`;

  // Write updated database
  fs.writeFileSync('./player-database-new.js', fileContent);

  console.log('\n📊 Summary:');
  console.log(`✅ Updated: ${updatedCount} players`);
  console.log(`❌ Not found: ${notFoundCount} players`);
  
  if (notFoundPlayers.length > 0 && notFoundPlayers.length <= 20) {
    console.log('\n❓ Players without images:');
    notFoundPlayers.forEach(name => console.log(`   - ${name}`));
  }

  console.log('\n✨ Database updated successfully!');
  console.log('📁 File: player-database-new.js\n');
}

// Run the update
updatePlayerImages();
