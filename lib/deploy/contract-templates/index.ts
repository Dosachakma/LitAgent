import { erc20Template, encodeERC20DeployData, ERC20_ABI, ERC20_BYTECODE } from './erc20';
import { erc721Template, encodeERC721DeployData, ERC721_ABI, ERC721_BYTECODE } from './erc721';
import { simpleStorageTemplate, encodeSimpleStorageDeployData, SIMPLE_STORAGE_ABI, SIMPLE_STORAGE_BYTECODE } from './simple-storage';
import { ownableTemplate, encodeOwnableDeployData, OWNABLE_ABI, OWNABLE_BYTECODE } from './ownable';
import type { ContractTemplate } from '../deployment-types';

export {
  erc20Template,
  encodeERC20DeployData,
  ERC20_ABI,
  ERC20_BYTECODE,
  erc721Template,
  encodeERC721DeployData,
  ERC721_ABI,
  ERC721_BYTECODE,
  simpleStorageTemplate,
  encodeSimpleStorageDeployData,
  SIMPLE_STORAGE_ABI,
  SIMPLE_STORAGE_BYTECODE,
  ownableTemplate,
  encodeOwnableDeployData,
  OWNABLE_ABI,
  OWNABLE_BYTECODE,
};

export const CONTRACT_TEMPLATES: ContractTemplate[] = [
  erc20Template,
  erc721Template,
  simpleStorageTemplate,
  ownableTemplate,
];

export function getTemplateById(id: string): ContractTemplate | undefined {
  return CONTRACT_TEMPLATES.find((t) => t.id === id);
}
