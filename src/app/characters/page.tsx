"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation"; // Import useRouter
import Modal from "../../components/Modal"; // Import the Modal component
import Button from "../../components/Button"; // Import the Button component
import { FaPlus, FaTrash, FaPlay } from "react-icons/fa"; // Import FaPlay icon
// Use original import path for Character types
import { Character, CharacterClass } from "../../types/gameData";
import { loadCharacters, saveCharacters } from "../../utils/localStorage"; // Import localStorage utils

export default function CharactersPage() {
  const router = useRouter(); // Instantiate router
  const [characters, setCharacters] = useState<Character[]>([]); // State for character list
  const [selectedCharacter, setSelectedCharacter] = useState<number | null>(
    null
  );
  const [showDeleteModal, setShowDeleteModal] = useState(false); // State for modal visibility
  const [showCreateModal, setShowCreateModal] = useState(false); // State for create modal
  const [newCharacterName, setNewCharacterName] = useState(""); // State for new character name
  const [newCharacterClass, setNewCharacterClass] = useState<
    CharacterClass | ""
  >(""); // State for new character class

  // Load characters on component mount
  useEffect(() => {
    setCharacters(loadCharacters());
    // Auto-select first character if list is not empty
    const loadedChars = loadCharacters();
    if (loadedChars.length > 0) {
      setSelectedCharacter(loadedChars[0].id);
    } else {
      setSelectedCharacter(null);
    }
  }, []);

  // Update selected character if the list changes and the selected one is deleted
  useEffect(() => {
    if (
      selectedCharacter !== null &&
      !characters.find((c) => c.id === selectedCharacter)
    ) {
      setSelectedCharacter(characters.length > 0 ? characters[0].id : null);
    }
    // Optional: if list becomes empty and create modal isnt open, open it?
    // if (characters.length === 0 && !showCreateModal) {
    //   handleOpenCreateModal();
    // }
  }, [characters, selectedCharacter]);

  const handleSelectCharacter = (id: number) => {
    setSelectedCharacter(id);
  };

  // --- Create Character Logic ---
  const handleOpenCreateModal = () => {
    setNewCharacterName(""); // Reset fields
    setNewCharacterClass("");
    setShowCreateModal(true); // Open modal
  };

  const confirmCreateCharacter = () => {
    if (!newCharacterName.trim()) {
      alert("Por favor, insira um nome para o personagem.");
      return;
    }
    if (!newCharacterClass) {
      alert("Por favor, selecione uma classe.");
      return;
    }

    const newCharacter: Character = {
      id: Date.now(),
      name: newCharacterName.trim(),
      class: newCharacterClass,
      level: 1,
      currentXP: 0,
      currentAct: 1,
      currentAreaId: "cidade_principal",
      unlockedAreaIds: ["cidade_principal", "floresta_sombria"],
      armor: 0,
      evasion: 0,
      barrier: 0,
      blockChance: 0,
      maxHealth: 100, // Example starting health
      currentHealth: 100,
      fireResistance: 0,
      coldResistance: 0,
      lightningResistance: 0,
      voidResistance: 0,
      attackDamage: 5, // Example starting damage
      projectileDamage: 0,
      spellDamage: 0,
      fireDamage: 0,
      coldDamage: 0,
      lightningDamage: 0,
      voidDamage: 0,
    };

    const updatedCharacters = [...characters, newCharacter];
    setCharacters(updatedCharacters);
    saveCharacters(updatedCharacters);
    setSelectedCharacter(newCharacter.id); // Select the new character
    setShowCreateModal(false); // Close modal
  };

  const cancelCreate = () => {
    setShowCreateModal(false);
  };

  // --- Delete Character Logic ---
  const handleDeleteClick = () => {
    if (selectedCharacter !== null) {
      setShowDeleteModal(true);
    }
  };

  const confirmDeleteCharacter = () => {
    if (selectedCharacter !== null) {
      const updatedCharacters = characters.filter(
        (char) => char.id !== selectedCharacter
      );
      setCharacters(updatedCharacters);
      saveCharacters(updatedCharacters);
      // selectedCharacter state will be updated by the useEffect dependency
      setShowDeleteModal(false); // Close the modal
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
  };

  // Function to handle Play button click
  const handlePlayClick = () => {
    if (selectedCharacter !== null) {
      // Here you might want to store the selectedCharacter ID
      // in localStorage or context before navigating
      console.log(`Starting game with character ID: ${selectedCharacter}`);
      router.push("/world-map");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-black text-white font-sans relative">
      <div
        className="border border-white p-6 md:p-10 rounded w-full max-w-md flex flex-col"
        style={{ minHeight: "70vh" }}
      >
        <h2 className="text-2xl font-bold text-center mb-6">Personagens</h2>
        <div className="flex-grow border border-white mb-6 p-4 overflow-y-auto min-h-[30vh]">
          {characters.length > 0 ? (
            characters.map((char) => (
              <div
                key={char.id}
                className={`border p-3 mb-2 cursor-pointer flex justify-between items-center transition-colors duration-200 ${
                  selectedCharacter === char.id
                    ? "border-2 border-white bg-gray-800"
                    : "border-gray-600 hover:bg-gray-700"
                }`}
                onClick={() => handleSelectCharacter(char.id)}
                style={
                  selectedCharacter === char.id
                    ? { boxShadow: "0 0 0 1px white inset" }
                    : {}
                }
              >
                <span>
                  Lvl {char.level} - {char.name} ({char.class})
                </span>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500">
              Nenhum personagem criado. Clique em Criar.
            </p>
          )}
        </div>
        <div className="flex justify-center gap-4">
          <Button
            onClick={handleOpenCreateModal}
            className="flex items-center gap-2"
          >
            <FaPlus />
            Criar
          </Button>
          <Button
            onClick={handleDeleteClick}
            disabled={selectedCharacter === null}
            className="flex items-center gap-2"
          >
            <FaTrash />
            Deletar
          </Button>
          <Button
            onClick={handlePlayClick}
            disabled={selectedCharacter === null}
            className="flex items-center gap-2"
          >
            <FaPlay />
            Jogar
          </Button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={cancelDelete}
        title="Confirmar Exclusão"
        actions={
          <>
            <Button onClick={cancelDelete}>Cancelar</Button>
            <Button onClick={confirmDeleteCharacter}>Confirmar</Button>
          </>
        }
      >
        <p>Tem certeza que deseja remover o personagem selecionado?</p>
      </Modal>

      {/* Create Character Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={cancelCreate}
        title="Criar Novo Personagem"
        actions={
          <div className="flex justify-center w-full gap-4">
            <Button onClick={cancelCreate}>Cancelar</Button>
            <Button onClick={confirmCreateCharacter}>Criar Personagem</Button>
          </div>
        }
      >
        <div className="flex flex-col gap-4 items-start">
          <label htmlFor="charName" className="text-sm font-semibold">
            Nome:
          </label>
          <input
            id="charName"
            type="text"
            value={newCharacterName}
            onChange={(e) => setNewCharacterName(e.target.value)}
            placeholder="Nome do Personagem"
            className="w-full p-2 border border-gray-600 rounded bg-black text-white focus:outline-none focus:border-white"
            maxLength={20}
          />

          <label className="text-sm font-semibold mt-2">Classe:</label>
          <div className="flex flex-col items-start w-full">
            {(["Guerreiro", "Ladino", "Mago"] as CharacterClass[]).map(
              (charClass) => (
                <label
                  key={charClass}
                  className="flex items-center gap-2 mb-1 cursor-pointer"
                >
                  <input
                    type="radio"
                    name="characterClass"
                    value={charClass}
                    checked={newCharacterClass === charClass}
                    onChange={() => setNewCharacterClass(charClass)}
                    className="accent-white cursor-pointer" // Style radio button
                  />
                  {charClass}
                </label>
              )
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
