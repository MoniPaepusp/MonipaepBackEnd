<h1  align="center">Back-End MoniPaEp</h1>

<h2  align="center">
Implementação da base de dados para o aplicativo MonipaEp e seu sistema web de gerenciamento de pacientes.
</h2>


![](https://github.com/vinicius-claus/IC-MoniPaEp-Backend/blob/production/bd.png)

  

## Como executar

### Requisitos

- `Docker`
- `Yarn`

### Passos

- Fazer um clone do projeto para o seu computador com:
  ```
  git clone https://github.com/MoniPaepUSP/MonipaepBackEnd/tree/main
  ```
- Renomeie `.env.example` para `.env`.

#### Na primeira vez
- Rode o banco de dados: `docker compose up -d`
- Rode as migrations que existem no projeto: `npm run migration:run`
- Insira os dados de exemplo: `psql -h localhost -U postgres -d monipaep -f populate_db.sql` (insira a senha)
- Feche o container do banco de dados: `docker compose down`

#### Nas vezes que for rodar:
- Rode o docker compose dentro da raiz do projeto:
  ```
  sudo docker-compose up # caso queira deixar em segundo plano, usar -d
  ```
  

  

<!-- ## 💬 Funcionalidades até o momento

<ul>

<li>Gerenciamento de permissões por meio de JWT e refresh tokens</li>

<li>Gerenciamento de Pacientes</li>

<li>Gerenciamento de funcionários</li>

<li>Gerenciamento de Sintomas</li>

<li>Gerenciamento de Doenças</li>

<li>Gerenciamento de Protocólos de Saúde</li>

<li>Gerenciamento de Unidades de Saúde</li>

<li>Gerenciamento de Perguntas Frequentes</li>

<li>Gerenciamento de Vacinas</li>

</ul> -->

  

## Tecnologias utilizadas

  

<ul>
	<li>Base de Dados: PostgreeSQL
	<li>Linguagem de programação: Typescript
	<li>ORM utilizado: TypeORM
	<li>NodeJS
	<li>Tipo de commit utilizado: Commitizen
</ul>

  

## Padrão Commitizen

- `feat`: adiciona ou remove novas funcionalidades.
- `fix`: corrige algum bug.
- `refactor`: commits que reescrevem ou reestruturam o código, porém não alteram o comportamento da aplicação.
- `perf`: direcionados para melhoria de desempenho.
- `style`: mudanças no código que não afetam o seu comportamento (ponto e vírgula, espaço em branco, formatação).
- `test`: adiciona ou corrige testes existentes.
- `docs`: commits que afetam apenas a documentação.
- `build`: afeta apenas os componentes de construção (ferramentas, dependências, versão do projeto...).
- `ci`: afeta apenas os componentes de configuração do CI, arquivos ou scripts (Travis, Circle, BrowserStack, SauceLabs)
- `chore`: outras mudanças que não afetam o source ou arquivos de teste.
